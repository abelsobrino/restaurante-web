-- Ejecutar después de 01_mensajes.sql. Solo modifica los objetos del módulo de mensajes.
begin;
alter table public.lf_notificaciones drop constraint if exists lf_notificaciones_tipo_check;
alter table public.lf_notificaciones add constraint lf_notificaciones_tipo_check check (tipo in ('RESPUESTA','PROMOCION','AVISO','NOVEDAD','INFORMACION','PERSONALIZADA'));
alter table public.lf_notificaciones add column if not exists categoria text;
alter table public.lf_contactos add column if not exists respondido_email text;
alter table public.lf_envios_promociones add column if not exists administrador_email text;
alter table public.lf_envios_promociones add column if not exists tipo text not null default 'PROMOCION';
alter table public.lf_envios_promociones add column if not exists categoria text;
alter table public.lf_envios_promociones add column if not exists audiencia text not null default 'SUSCRITOS';
alter table public.lf_envios_promociones add column if not exists destinatario_email text;
-- web_login es la autoridad de autenticación del sistema web. El ID devuelto no es necesariamente
-- un ID de usuarios (por ejemplo, una cuenta administrativa histórica de la web).
-- Si existe un registro de personal con ese correo, nunca permitir uno inactivo o no administrativo.
-- Si no existe, aceptar únicamente el rol ADMIN autenticado por web_login; registrar el correo
-- verificado en auditoría y dejar la FK nullable. No aceptar roles, IDs ni permisos del navegador.
create or replace function public.lf_mensajes_actor(p_email text,p_password text,p_rol text) returns bigint
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare v jsonb; actor bigint; coincidencias integer;
begin
 if p_rol is null or p_rol not in ('ADMIN','CLIENTE') or nullif(trim(p_email),'') is null or nullif(p_password,'') is null then raise exception 'Sesión inválida'; end if;
 v:=to_jsonb(public.web_login(p_email=>trim(p_email),p_password=>p_password));
 if coalesce(v->>'ok','false') <> 'true' or upper(trim(coalesce(v->>'rol',''))) <> p_rol then raise exception 'Acceso no autorizado'; end if;
 if p_rol='CLIENTE' then
   select c.id into actor from public.clientes c where c.id::text=v->>'id' and lower(trim(c.email))=lower(trim(p_email)) and c.activo is true;
   if actor is null then raise exception 'Acceso no autorizado'; end if;
 else
   select count(*)::integer into coincidencias from public.usuarios u where lower(trim(u.email))=lower(trim(p_email));
   if coincidencias>1 then raise exception 'Acceso no autorizado: correo administrativo duplicado'; end if;
   if coincidencias=1 then
     select u.id into actor from public.usuarios u where lower(trim(u.email))=lower(trim(p_email)) and upper(trim(u.rol))='ADMIN' and u.activo is true;
     if actor is null then raise exception 'Acceso no autorizado: cuenta administrativa inactiva o sin rol ADMIN'; end if;
   end if;
 end if;
 return actor;
end $$;
revoke all on function public.lf_mensajes_actor(text,text,text) from public,anon,authenticated;
create or replace function public.lf_contacto_responder(p_email text,p_password text,p_id bigint,p_respuesta text) returns boolean
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare a bigint; c bigint;
begin
 a:=public.lf_mensajes_actor(p_email,p_password,'ADMIN');
 if p_respuesta is null or char_length(trim(p_respuesta)) not between 2 and 1500 then raise exception 'Respuesta inválida'; end if;
 update public.lf_contactos set estado='RESPONDIDO',respuesta=trim(p_respuesta),respondido_por=a,respondido_email=lower(trim(p_email)),respondido_at=now(),visto_at=coalesce(visto_at,now()) where id=p_id and estado in ('PENDIENTE','VISTO') returning cliente_id into c;
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
 return jsonb_build_object('no_leidas',(select count(*) from public.lf_notificaciones where cliente_id=c and leido_at is null),'promociones',coalesce((select promociones from public.lf_preferencias_notificaciones where cliente_id=c),false),'notificaciones',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('id',x.id::text) order by x.id desc),'[]'::jsonb) from (select n.id,n.tipo,n.categoria,n.titulo,n.mensaje,n.creado_at,n.leido_at,ct.mensaje as mensaje_original from public.lf_notificaciones n left join public.lf_contactos ct on ct.id=n.contacto_id and ct.cliente_id=c where n.cliente_id=c and (p_antes is null or n.id<p_antes) order by n.id desc limit 50) x));
end $$;
create or replace function public.lf_notificacion_enviar(p_email text,p_password text,p_solicitud uuid,p_tipo text,p_categoria text,p_titulo text,p_mensaje text,p_audiencia text,p_destinatario text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare a bigint; cantidad integer; anterior public.lf_envios_promociones%rowtype; destino text; categoria_normal text; correo text; cliente bigint;
begin
 a:=public.lf_mensajes_actor(p_email,p_password,'ADMIN');
 correo:=lower(trim(p_email)); destino:=nullif(lower(trim(p_destinatario)),''); categoria_normal:=nullif(trim(p_categoria),'');
 if p_solicitud is null or p_tipo is null or p_tipo not in ('PROMOCION','AVISO','NOVEDAD','INFORMACION','PERSONALIZADA') or p_audiencia is null or p_audiencia not in ('SUSCRITOS','INDIVIDUAL','ACTIVOS') or p_titulo is null or char_length(trim(p_titulo)) not between 2 and 120 or p_mensaje is null or char_length(trim(p_mensaje)) not between 2 and 1500 then raise exception 'Revisa los datos de la notificación'; end if;
 if p_tipo='PERSONALIZADA' then
   if categoria_normal is null or char_length(categoria_normal) not between 2 and 40 then raise exception 'Indica una categoría de 2 a 40 caracteres'; end if;
 else categoria_normal:=null; end if;
 if p_audiencia='ACTIVOS' and p_tipo<>'AVISO' then raise exception 'Todos los activos se reserva para avisos de servicio'; end if;
 if p_audiencia='INDIVIDUAL' then
   if destino is null or char_length(destino)>150 then raise exception 'Indica el correo del cliente'; end if;
 else destino:=null; end if;
 perform pg_advisory_xact_lock(hashtextextended('lf_envio:'||p_solicitud::text,0));
 select * into anterior from public.lf_envios_promociones where solicitud=p_solicitud;
 if found then
   if not (anterior.administrador_email is not distinct from correo or (anterior.administrador_email is null and a is not null and anterior.administrador_id=a)) or anterior.tipo<>p_tipo or anterior.audiencia<>p_audiencia or anterior.categoria is distinct from categoria_normal or anterior.destinatario_email is distinct from destino or anterior.titulo<>trim(p_titulo) or anterior.mensaje<>trim(p_mensaje) then raise exception 'Solicitud de envío incompatible'; end if;
   return jsonb_build_object('destinatarios',anterior.destinatarios);
 end if;
 if p_audiencia='INDIVIDUAL' then
   select c.id into cliente from public.clientes c where lower(trim(c.email))=destino and c.activo is true and (p_tipo='AVISO' or exists(select 1 from public.lf_preferencias_notificaciones p where p.cliente_id=c.id and p.promociones is true));
   if cliente is null then raise exception 'Cliente no disponible o sin consentimiento para novedades'; end if;
 end if;
 insert into public.lf_envios_promociones(solicitud,administrador_id,administrador_email,titulo,mensaje,tipo,categoria,audiencia,destinatario_email) values(p_solicitud,a,correo,trim(p_titulo),trim(p_mensaje),p_tipo,categoria_normal,p_audiencia,destino);
 insert into public.lf_notificaciones(cliente_id,tipo,categoria,titulo,mensaje)
 select c.id,p_tipo,categoria_normal,trim(p_titulo),trim(p_mensaje) from public.clientes c
 where c.activo is true and ((p_audiencia='INDIVIDUAL' and c.id=cliente) or p_audiencia='ACTIVOS' or (p_audiencia='SUSCRITOS' and exists(select 1 from public.lf_preferencias_notificaciones p where p.cliente_id=c.id and p.promociones is true)));
 get diagnostics cantidad=row_count;
 update public.lf_envios_promociones set destinatarios=cantidad where solicitud=p_solicitud;
 return jsonb_build_object('destinatarios',cantidad);
end $$;
-- Compatibilidad con el frontend anterior; misma autenticación y registro de auditoría.
create or replace function public.lf_promocion_notificar(p_email text,p_password text,p_solicitud uuid,p_titulo text,p_mensaje text) returns jsonb
language sql security definer set search_path=pg_catalog,public,extensions as $$
 select public.lf_notificacion_enviar(p_email,p_password,p_solicitud,'PROMOCION',null,p_titulo,p_mensaje,'SUSCRITOS',null);
$$;
revoke all on function public.lf_notificacion_enviar(text,text,uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.lf_notificacion_enviar(text,text,uuid,text,text,text,text,text,text) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
