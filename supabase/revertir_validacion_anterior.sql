begin;

drop function if exists public.web_registrar_cliente_validado(text,text,text,text,text);
drop index if exists public.clientes_email_normalizado_unico;

do $$
declare
    v_funcion regprocedure;
begin
    for v_funcion in
        select p.oid::regprocedure
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'web_registrar_cliente'
    loop
        execute format('grant execute on function %s to anon, authenticated', v_funcion);
    end loop;
end;
$$;

commit;
