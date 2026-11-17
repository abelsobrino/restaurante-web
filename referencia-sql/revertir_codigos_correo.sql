begin;

drop function if exists public.web_confirmar_registro_cliente(text,text,text,text,text);
drop function if exists public.web_restablecer_contrasena_cliente(text,text);

do $$
declare
    v_funcion regprocedure;
begin
    for v_funcion in
        select p.oid::regprocedure
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in ('web_registrar_cliente_validado', 'web_registrar_cliente')
    loop
        execute format('grant execute on function %s to anon, authenticated', v_funcion);
    end loop;
end;
$$;

commit;
