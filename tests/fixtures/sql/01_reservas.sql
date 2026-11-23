-- Ejecutar en SQL Editor de Supabase con un rol propietario. Reejecutable sobre la versión anterior; conserva reservas existentes.
-- No modifica las tablas existentes ni sus políticas. Toda la migración es atómica.
begin;
create table if not exists public.reservas_web (
 id bigint generated always as identity primary key,
 cliente_id bigint not null references public.clientes(id),
 nombre text not null check (char_length(nombre) between 2 and 120),
 telefono text not null check (telefono ~ '^[0-9]{7,15}$'),
 fecha date not null, hora time(0) not null check (hora between time '12:00' and time '23:00'),
 personas integer not null check (personas between 1 and 20),
 descripcion text not null default '' check (char_length(descripcion)<=500),
 estado text not null default 'PENDIENTE' check (estado in ('PENDIENTE','ASIGNADA','EN_ATENCION','FINALIZADA','CANCELADA','NO_ASISTIO')),
 mesa_id bigint references public.mesas(id),
 pedido_id bigint unique references public.pedidos(id),
 creado_at timestamptz not null default now(),
 check (estado not in ('ASIGNADA','EN_ATENCION','FINALIZADA','NO_ASISTIO') or mesa_id is not null)
);
-- No reemplaza web_login ni modifica ninguna tabla compartida.
do $$
begin
 if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='web_login' and p.proargnames @> array['p_email','p_password']::text[]) then
   raise exception 'Falta la RPC public.web_login con p_email y p_password; revisa la autenticación web existente';
 end if;
 if exists (
   select 1 from (values ('id','bigint'),('cliente_id','bigint'),('nombre','text'),('telefono','text'),('fecha','date'),('hora','time without time zone'),('personas','integer'),('descripcion','text'),('estado','text'),('mesa_id','bigint'),('pedido_id','bigint'),('creado_at','timestamp with time zone')) as esperado(col,tipo)
   where not exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name='reservas_web' and c.column_name=esperado.col and c.data_type=esperado.tipo)
 ) then raise exception 'reservas_web tiene una estructura distinta; no se modificaron datos'; end if;
end $$;
create index if not exists reservas_web_fecha on public.reservas_web(fecha,hora);
create index if not exists reservas_web_mesa on public.reservas_web(mesa_id,fecha,hora);
create unique index if not exists reservas_web_cliente_hora on public.reservas_web(cliente_id,fecha,hora) where estado in ('PENDIENTE','ASIGNADA','EN_ATENCION');
alter table public.reservas_web enable row level security;
revoke all on public.reservas_web from public, anon, authenticated;
-- Reutiliza el contrato de autenticación existente; no confía en un ID enviado por el cliente.
create or replace function public.lf_reserva_cliente(p_email text,p_password text) returns bigint
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare v jsonb; c bigint;
begin
 if nullif(trim(p_email),'') is null or nullif(p_password,'') is null then raise exception 'Sesión de cliente inválida'; end if;
 v := to_jsonb(public.web_login(p_email=>trim(p_email),p_password=>p_password));
 if coalesce(v->>'ok','false') <> 'true' or upper(coalesce(v->>'rol','')) <> 'CLIENTE' then raise exception 'Sesión de cliente inválida'; end if;
 select id into c from public.clientes where id=(v->>'id')::bigint and lower(trim(email))=lower(trim(p_email)) and activo is true;
 if c is null then raise exception 'Sesión de cliente inválida'; end if;
 return c;
end $$;
revoke all on function public.lf_reserva_cliente(text,text) from public,anon,authenticated;
create or replace function public.lf_crear_reserva(p_email text,p_password text,p_nombre text,p_telefono text,p_fecha date,p_hora time,p_personas integer,p_descripcion text) returns bigint
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare c bigint; r bigint;
begin
 c:=public.lf_reserva_cliente(p_email,p_password);
 if p_fecha is null or p_hora is null or p_personas is null or p_personas not between 1 and 20 or p_nombre is null or char_length(trim(p_nombre)) not between 3 and 100 or p_telefono is null or trim(p_telefono) !~ '^[0-9]{7,15}$' or char_length(coalesce(trim(p_descripcion),'')) > 500 then raise exception 'Revisa los datos obligatorios de la reserva'; end if;
 if p_hora not between time '12:00' and time '23:00' then raise exception 'Horario de reservas: 12:00 a 23:00'; end if;
 if p_fecha+p_hora <= timezone('America/Lima',now()) then raise exception 'Selecciona una fecha y hora futuras'; end if;
 insert into public.reservas_web(cliente_id,nombre,telefono,fecha,hora,personas,descripcion) values(c,trim(p_nombre),trim(p_telefono),p_fecha,p_hora,p_personas,coalesce(trim(p_descripcion),'')) returning id into r;
 return r;
exception when unique_violation then raise exception 'Ya tienes una reserva activa para esta fecha y hora';
end $$;
create or replace function public.lf_mis_reservas(p_email text,p_password text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare c bigint;
begin
 c:=public.lf_reserva_cliente(p_email,p_password);
 return (select coalesce(jsonb_agg(jsonb_build_object('id',r.id::text,'nombre',r.nombre,'telefono',r.telefono,'fecha',r.fecha,'hora',to_char(r.hora,'HH24:MI'),'sillas',r.personas,'mesa_numero',m.numero,'descripcion',r.descripcion,'estado',r.estado,'email',p_email) order by r.fecha,r.hora),'[]'::jsonb) from public.reservas_web r left join public.mesas m on m.id=r.mesa_id where r.cliente_id=c);
end $$;
create or replace function public.lf_cancelar_reserva(p_email text,p_password text,p_id bigint) returns boolean
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare c bigint;
begin
 c:=public.lf_reserva_cliente(p_email,p_password);
 update public.reservas_web set estado='CANCELADA' where id=p_id and cliente_id=c and estado in ('PENDIENTE','ASIGNADA') and fecha+hora>timezone('America/Lima',now());
 if not found then raise exception 'No se puede cancelar esta reserva'; end if;
 return true;
end $$;
revoke all on function public.lf_crear_reserva(text,text,text,text,date,time,integer,text), public.lf_mis_reservas(text,text), public.lf_cancelar_reserva(text,text,bigint) from public,anon,authenticated;
grant execute on function public.lf_crear_reserva(text,text,text,text,date,time,integer,text), public.lf_mis_reservas(text,text), public.lf_cancelar_reserva(text,text,bigint) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
