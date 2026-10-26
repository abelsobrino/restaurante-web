begin;

create or replace function public.web_confirmar_registro_cliente(
    p_nombre text,
    p_apellido text,
    p_email text,
    p_telefono text,
    p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_email text := lower(btrim(coalesce(p_email, '')));
    v_verificado text;
    v_resultado jsonb;
begin
    if auth.uid() is null or auth.role() <> 'authenticated' then
        return jsonb_build_object('ok', false, 'mensaje', 'Primero verifica tu correo electrónico.');
    end if;

    select lower(btrim(u.email)) into v_verificado
    from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and u.last_sign_in_at >= now() - interval '15 minutes'
      and lower(btrim(u.email)) = v_email;

    if v_verificado is null then
        return jsonb_build_object('ok', false, 'mensaje', 'La verificación expiró o el correo no coincide. Solicita un nuevo código.');
    end if;

    v_resultado := public.web_registrar_cliente_validado(
        p_nombre => p_nombre,
        p_apellido => p_apellido,
        p_email => v_email,
        p_telefono => p_telefono,
        p_password => p_password
    );

    if coalesce((v_resultado ->> 'ok')::boolean, false) then
        update public.clientes
        set email_verificado_at = now()
        where lower(btrim(email)) = v_email;
    end if;

    return v_resultado;
exception
    when unique_violation then
        return jsonb_build_object('ok', false, 'mensaje', 'Este correo ya está registrado.');
end;
$$;

create or replace function public.web_restablecer_contrasena_cliente(
    p_email text,
    p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_email text := lower(btrim(coalesce(p_email, '')));
    v_verificado text;
    v_cliente_id bigint;
    v_password_actual text;
    v_password_nuevo text;
    v_crypt_schema text;
    v_prueba_login jsonb;
begin
    if auth.uid() is null or auth.role() <> 'authenticated' then
        return jsonb_build_object('ok', false, 'mensaje', 'Debes verificar tu correo para recuperar la cuenta.');
    end if;

    select lower(btrim(u.email)) into v_verificado
    from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and u.last_sign_in_at >= now() - interval '15 minutes'
      and lower(btrim(u.email)) = v_email;

    if v_verificado is null then
        return jsonb_build_object('ok', false, 'mensaje', 'La verificación expiró o el correo no coincide. Solicita un nuevo código.');
    end if;

    if p_password is null
       or char_length(p_password) not between 8 and 72
       or p_password !~ '[A-Z]'
       or p_password !~ '[a-z]'
       or p_password !~ '[0-9]'
       or p_password !~ '[^A-Za-z0-9[:space:]]' then
        return jsonb_build_object('ok', false, 'mensaje', 'La contraseña requiere entre 8 y 72 caracteres, mayúscula, minúscula, número y símbolo.');
    end if;

    select c.id, c.password into v_cliente_id, v_password_actual
    from public.clientes c
    where lower(btrim(c.email)) = v_email
      and c.activo = true
    for update;

    if v_cliente_id is null then
        return jsonb_build_object('ok', false, 'mensaje', 'No existe una cuenta de cliente activa con ese correo.');
    end if;

    if v_password_actual ~ '^\$2[aby]\$' then
        if octet_length(p_password) > 72 then
            return jsonb_build_object('ok', false, 'mensaje', 'La contraseña no puede superar los 72 bytes.');
        end if;

        select n.nspname into v_crypt_schema
        from pg_extension e
        join pg_namespace n on n.oid = e.extnamespace
        where e.extname = 'pgcrypto';

        if v_crypt_schema is null then
            return jsonb_build_object('ok', false, 'mensaje', 'El servidor necesita habilitar pgcrypto para cambiar esta contraseña.');
        end if;

        execute format('select %I.crypt($1, %I.gen_salt(''bf''))', v_crypt_schema, v_crypt_schema)
        using p_password into v_password_nuevo;
    elsif coalesce(v_password_actual, '') ~ '^\$' or coalesce(v_password_actual, '') ~ '^md5[[:xdigit:]]{32}$' then
        return jsonb_build_object('ok', false, 'mensaje', 'El método de cifrado de esta cuenta requiere adaptar la recuperación.');
    else
        v_password_nuevo := p_password;
    end if;

    update public.clientes
    set password = v_password_nuevo,
        updated_at = localtimestamp
    where id = v_cliente_id;

    v_prueba_login := to_jsonb(public.web_login(p_email => v_email, p_password => p_password));
    if not coalesce((v_prueba_login ->> 'ok')::boolean, false) then
        raise exception 'El inicio de sesión no acepta el formato de la nueva contraseña; cambio cancelado.';
    end if;

    return jsonb_build_object('ok', true, 'mensaje', 'Contraseña actualizada correctamente.');
end;
$$;

revoke all on function public.web_confirmar_registro_cliente(text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.web_restablecer_contrasena_cliente(text,text) from public, anon, authenticated;
grant execute on function public.web_confirmar_registro_cliente(text,text,text,text,text) to authenticated;
grant execute on function public.web_restablecer_contrasena_cliente(text,text) to authenticated;

do $$
declare
    v_funcion regprocedure;
    v_cantidad integer := 0;
begin
    for v_funcion in
        select p.oid::regprocedure
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in ('web_registrar_cliente_validado', 'web_registrar_cliente')
    loop
        execute format('revoke execute on function %s from public, anon, authenticated', v_funcion);
        v_cantidad := v_cantidad + 1;
    end loop;
    if v_cantidad < 2 then
        raise exception 'Se necesitan las funciones de registro anteriores. Instala primero registro_clientes_validado.sql.';
    end if;
end;
$$;

commit;
