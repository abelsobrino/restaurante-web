-- La Fonda: contacto y notificaciones internas. Ejecutar como propietario en SQL Editor.
-- Independiente de reservas, pedidos, inventario y aplicación de escritorio.
begin;
do $$ begin
 if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='web_login' and p.proargnames @> array['p_email','p_password']::text[]) then
  raise exception 'Falta la función web_login compatible; no se aplicó la migración';
 end if;
end $$;
create table if not exists public.lf_contactos (
 id bigint generated always as identity primary key,
 cliente_id bigint not null references public.clientes(id) on delete cascade,
 solicitud uuid not null,
 nombre text not null check (char_length(nombre) between 3 and 100),
 email text not null check (char_length(email) between 3 and 150),
 tipo text not null check (tipo in ('consulta','sugerencia','queja','felicitacion')),
 mensaje text not null check (char_length(mensaje) between 10 and 800),
 estado text not null default 'PENDIENTE' check (estado in ('PENDIENTE','VISTO','RESPONDIDO')),
 respuesta text check (char_length(respuesta) between 2 and 1500),
 respondido_por bigint references public.usuarios(id) on delete set null,
 creado_at timestamptz not null default now(),
 visto_at timestamptz,
 respondido_at timestamptz,
 unique(cliente_id, solicitud)
);
create table if not exists public.lf_notificaciones (
 id bigint generated always as identity primary key,
 cliente_id bigint not null references public.clientes(id) on delete cascade,
 contacto_id bigint unique references public.lf_contactos(id) on delete cascade,
 tipo text not null check (tipo in ('RESPUESTA','PROMOCION')),
 titulo text not null check (char_length(titulo) between 2 and 120),
 mensaje text not null check (char_length(mensaje) between 2 and 1500),
 creado_at timestamptz not null default now(),
 leido_at timestamptz
);
create table if not exists public.lf_preferencias_notificaciones (
 cliente_id bigint primary key references public.clientes(id) on delete cascade,
 promociones boolean not null default false
);
create table if not exists public.lf_envios_promociones (
 solicitud uuid primary key,
 administrador_id bigint references public.usuarios(id) on delete set null,
 titulo text not null,
 mensaje text not null,
 destinatarios integer not null default 0,
 creado_at timestamptz not null default now()
);
create index if not exists lf_contactos_cliente_idx on public.lf_contactos(cliente_id,creado_at desc);
create index if not exists lf_contactos_estado_idx on public.lf_contactos(estado,id desc);
create index if not exists lf_notificaciones_cliente_idx on public.lf_notificaciones(cliente_id,id desc);
create index if not exists lf_notificaciones_no_leidas_idx on public.lf_notificaciones(cliente_id) where leido_at is null;
alter table public.lf_contactos enable row level security;
alter table public.lf_notificaciones enable row level security;
alter table public.lf_preferencias_notificaciones enable row level security;
alter table public.lf_envios_promociones enable row level security;
revoke all on public.lf_contactos,public.lf_notificaciones,public.lf_preferencias_notificaciones,public.lf_envios_promociones from public,anon,authenticated;
-- Autenticación del sistema original; nunca confiar en IDs/roles del navegador.
create or replace function public.lf_mensajes_actor(p_email text,p_password text,p_rol text) returns bigint
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare v jsonb; actor bigint;
begin
 if p_rol not in ('ADMIN','CLIENTE') or nullif(trim(p_email),'') is null or nullif(p_password,'') is null then raise exception 'Sesión inválida'; end if;
 v:=to_jsonb(public.web_login(p_email=>trim(p_email),p_password=>p_password));
 if coalesce(v->>'ok','false') <> 'true' or upper(coalesce(v->>'rol','')) <> p_rol then raise exception 'Acceso no autorizado'; end if;
 if p_rol='CLIENTE' then
   select c.id into actor from public.clientes c where c.id=(v->>'id')::bigint and lower(trim(c.email))=lower(trim(p_email)) and c.activo is true;
 else
   select u.id into actor from public.usuarios u where u.id=(v->>'id')::bigint and lower(trim(u.email))=lower(trim(p_email)) and upper(u.rol)='ADMIN' and u.activo is true;
 end if;
 if actor is null then raise exception 'Acceso no autorizado'; end if;
 return actor;
end $$;
revoke all on function public.lf_mensajes_actor(text,text,text) from public,anon,authenticated;
create or replace function public.lf_contacto_enviar(p_email text,p_password text,p_solicitud uuid,p_tipo text,p_mensaje text) returns text
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare c bigint; r bigint; n text; e text;
begin
 c:=public.lf_mensajes_actor(p_email,p_password,'CLIENTE');
 if p_solicitud is null or p_tipo is null or p_tipo not in ('consulta','sugerencia','queja','felicitacion') or p_mensaje is null or char_length(trim(p_mensaje)) not between 10 and 800 then raise exception 'Revisa el tipo y contenido del mensaje'; end if;
 perform pg_advisory_xact_lock(hashtextextended('lf_contacto:'||c::text,0));
 select id into r from public.lf_contactos where cliente_id=c and solicitud=p_solicitud;
 if r is not null then return r::text; end if;
 if (select count(*) from public.lf_contactos where cliente_id=c and creado_at>now()-interval '1 hour')>=5 then raise exception 'Has alcanzado el límite de 5 mensajes por hora'; end if;
 select left(trim(concat_ws(' ',nombre,apellido)),100),email into n,e from public.clientes where id=c;
 insert into public.lf_contactos(cliente_id,solicitud,nombre,email,tipo,mensaje) values(c,p_solicitud,n,e,p_tipo,trim(p_mensaje)) returning id into r;
 return r::text;
end $$;
create or replace function public.lf_contacto_admin_lista(p_email text,p_password text,p_estado text,p_antes bigint default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
begin
 perform public.lf_mensajes_actor(p_email,p_password,'ADMIN');
 if p_estado is null or p_estado not in ('TODOS','PENDIENTE','VISTO','RESPONDIDO') then raise exception 'Filtro inválido'; end if;
 return jsonb_build_object('pendientes',(select count(*) from public.lf_contactos where estado='PENDIENTE'), 'mensajes', (select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('id',x.id::text) order by x.id desc),'[]'::jsonb) from (select id,nombre,email,tipo,mensaje,estado,respuesta,creado_at,visto_at,respondido_at from public.lf_contactos where (p_estado='TODOS' or estado=p_estado) and (p_antes is null or id<p_antes) order by id desc limit 50) x));
end $$;
create or replace function public.lf_contacto_visto(p_email text,p_password text,p_id bigint) returns boolean
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
begin
 perform public.lf_mensajes_actor(p_email,p_password,'ADMIN');
 update public.lf_contactos set estado='VISTO',visto_at=now() where id=p_id and estado='PENDIENTE';
 return exists(select 1 from public.lf_contactos where id=p_id);
end $$;
create or replace function public.lf_contacto_responder(p_email text,p_password text,p_id bigint,p_respuesta text) returns boolean
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare a bigint; c bigint;
begin
 a:=public.lf_mensajes_actor(p_email,p_password,'ADMIN');
 if p_respuesta is null or char_length(trim(p_respuesta)) not between 2 and 1500 then raise exception 'Respuesta inválida'; end if;
 update public.lf_contactos set estado='RESPONDIDO',respuesta=trim(p_respuesta),respondido_por=a,respondido_at=now(),visto_at=coalesce(visto_at,now()) where id=p_id and estado in ('PENDIENTE','VISTO') returning cliente_id into c;
 if c is null then
   if exists(select 1 from public.lf_contactos where id=p_id and estado='RESPONDIDO' and respuesta=trim(p_respuesta)) then return true; end if;
   raise exception 'El mensaje no existe o ya fue respondido';
 end if;
 insert into public.lf_notificaciones(cliente_id,contacto_id,tipo,titulo,mensaje) values(c,p_id,'RESPUESTA','Respuesta de La Fonda',trim(p_respuesta));
 return true;
end $$;
create or replace function public.lf_notificaciones_lista(p_email text,p_password text,p_antes bigint default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare c bigint;
begin
 c:=public.lf_mensajes_actor(p_email,p_password,'CLIENTE');
 return jsonb_build_object('no_leidas',(select count(*) from public.lf_notificaciones where cliente_id=c and leido_at is null),'promociones',coalesce((select promociones from public.lf_preferencias_notificaciones where cliente_id=c),false),'notificaciones',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('id',x.id::text) order by x.id desc),'[]'::jsonb) from (select n.id,n.tipo,n.titulo,n.mensaje,n.creado_at,n.leido_at,ct.mensaje as mensaje_original from public.lf_notificaciones n left join public.lf_contactos ct on ct.id=n.contacto_id and ct.cliente_id=c where n.cliente_id=c and (p_antes is null or n.id<p_antes) order by n.id desc limit 50) x));
end $$;
create or replace function public.lf_notificaciones_contar(p_email text,p_password text) returns integer
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare c bigint;
begin
 c:=public.lf_mensajes_actor(p_email,p_password,'CLIENTE');
 return (select count(*)::integer from public.lf_notificaciones where cliente_id=c and leido_at is null);
end $$;
create or replace function public.lf_notificacion_leer(p_email text,p_password text,p_id bigint) returns boolean
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare c bigint;
begin
 c:=public.lf_mensajes_actor(p_email,p_password,'CLIENTE');
 update public.lf_notificaciones set leido_at=coalesce(leido_at,now()) where id=p_id and cliente_id=c;
 return found;
end $$;
create or replace function public.lf_notificaciones_preferencia(p_email text,p_password text,p_promociones boolean) returns boolean
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare c bigint;
begin
 c:=public.lf_mensajes_actor(p_email,p_password,'CLIENTE');
 if p_promociones is null then raise exception 'Preferencia inválida'; end if;
 insert into public.lf_preferencias_notificaciones(cliente_id,promociones) values(c,p_promociones) on conflict(cliente_id) do update set promociones=excluded.promociones;
 return true;
end $$;
create or replace function public.lf_promocion_notificar(p_email text,p_password text,p_solicitud uuid,p_titulo text,p_mensaje text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare a bigint; cantidad integer;
begin
 a:=public.lf_mensajes_actor(p_email,p_password,'ADMIN');
 if p_solicitud is null or p_titulo is null or char_length(trim(p_titulo)) not between 2 and 120 or p_mensaje is null or char_length(trim(p_mensaje)) not between 2 and 1500 then raise exception 'Completa el título y mensaje de la promoción'; end if;
 perform pg_advisory_xact_lock(hashtextextended('lf_promocion:'||p_solicitud::text,0));
 select destinatarios into cantidad from public.lf_envios_promociones where solicitud=p_solicitud and administrador_id=a;
 if found then return jsonb_build_object('destinatarios',cantidad); end if;
 insert into public.lf_envios_promociones(solicitud,administrador_id,titulo,mensaje) values(p_solicitud,a,trim(p_titulo),trim(p_mensaje));
 insert into public.lf_notificaciones(cliente_id,tipo,titulo,mensaje) select c.id,'PROMOCION',trim(p_titulo),trim(p_mensaje) from public.clientes c join public.lf_preferencias_notificaciones p on p.cliente_id=c.id where c.activo is true and p.promociones is true;
 get diagnostics cantidad=row_count;
 update public.lf_envios_promociones set destinatarios=cantidad where solicitud=p_solicitud;
 return jsonb_build_object('destinatarios',cantidad);
end $$;
-- Las tablas quedan cerradas. Solo RPC explícitas con autenticación del lado servidor.
revoke all on function public.lf_contacto_enviar(text,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.lf_contacto_enviar(text,text,uuid,text,text) to anon,authenticated;
revoke all on function public.lf_contacto_admin_lista(text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.lf_contacto_admin_lista(text,text,text,bigint) to anon,authenticated;
revoke all on function public.lf_contacto_visto(text,text,bigint) from public,anon,authenticated;
grant execute on function public.lf_contacto_visto(text,text,bigint) to anon,authenticated;
revoke all on function public.lf_contacto_responder(text,text,bigint,text) from public,anon,authenticated;
grant execute on function public.lf_contacto_responder(text,text,bigint,text) to anon,authenticated;
revoke all on function public.lf_notificaciones_lista(text,text,bigint) from public,anon,authenticated;
grant execute on function public.lf_notificaciones_lista(text,text,bigint) to anon,authenticated;
revoke all on function public.lf_notificaciones_contar(text,text) from public,anon,authenticated;
grant execute on function public.lf_notificaciones_contar(text,text) to anon,authenticated;
revoke all on function public.lf_notificacion_leer(text,text,bigint) from public,anon,authenticated;
grant execute on function public.lf_notificacion_leer(text,text,bigint) to anon,authenticated;
revoke all on function public.lf_notificaciones_preferencia(text,text,boolean) from public,anon,authenticated;
grant execute on function public.lf_notificaciones_preferencia(text,text,boolean) to anon,authenticated;
revoke all on function public.lf_promocion_notificar(text,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.lf_promocion_notificar(text,text,uuid,text,text) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
