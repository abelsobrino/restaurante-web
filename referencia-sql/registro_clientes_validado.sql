create unique index if not exists clientes_email_normalizado_unico
on public.clientes (lower(btrim(email)))
where email is not null;

create or replace function public.web_registrar_cliente_validado(
    p_nombre text,
    p_apellido text,
    p_email text,
    p_telefono text,
    p_password text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    v_nombre text := regexp_replace(btrim(coalesce(p_nombre, '')), '[[:space:]]+', ' ', 'g');
    v_apellido text := regexp_replace(btrim(coalesce(p_apellido, '')), '[[:space:]]+', ' ', 'g');
    v_email text := lower(btrim(coalesce(p_email, '')));
    v_telefono text := btrim(coalesce(p_telefono, ''));
begin
    if char_length(v_nombre) not between 2 and 60
       or v_nombre !~ '^[[:alpha:]]+([ ''’ -][[:alpha:]]+)*$' then
        return jsonb_build_object('ok', false, 'mensaje', 'Ingresa un nombre válido (2 a 60 caracteres).');
    end if;

    if char_length(v_apellido) not between 2 and 60
       or v_apellido !~ '^[[:alpha:]]+([ ''’ -][[:alpha:]]+)*$' then
        return jsonb_build_object('ok', false, 'mensaje', 'Ingresa un apellido válido (2 a 60 caracteres).');
    end if;

    if char_length(v_email) > 150
       or v_email !~* '^[^[:space:]@]+@[^[:space:]@.]+(\.[^[:space:]@.]+)+$'
       or strpos(v_email, '..') > 0 then
        return jsonb_build_object('ok', false, 'mensaje', 'Ingresa un correo electrónico válido.');
    end if;

    if v_telefono !~ '^9[0-9]{8}$' then
        return jsonb_build_object('ok', false, 'mensaje', 'Ingresa un celular peruano válido de 9 dígitos.');
    end if;

    if p_password is null
       or char_length(p_password) not between 8 and 72
       or p_password !~ '[A-Z]'
       or p_password !~ '[a-z]'
       or p_password !~ '[0-9]'
       or p_password !~ '[^A-Za-z0-9[:space:]]' then
        return jsonb_build_object('ok', false, 'mensaje', 'La contraseña debe tener de 8 a 72 caracteres, mayúscula, minúscula, número y símbolo.');
    end if;

    return to_jsonb(public.web_registrar_cliente(
        p_nombre => v_nombre,
        p_apellido => v_apellido,
        p_email => v_email,
        p_telefono => v_telefono,
        p_password => p_password
    ));
exception
    when unique_violation then
        return jsonb_build_object('ok', false, 'mensaje', 'Este correo electrónico ya está registrado.');
end;
$$;

grant execute on function public.web_registrar_cliente_validado(text, text, text, text, text) to anon, authenticated;
