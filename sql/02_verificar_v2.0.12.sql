-- Después de ejecutar 01_v2.0.12_stock_horarios.sql, consultar en SQL Editor.
SELECT 'stock_publico' AS modulo, public.lf_web_disponibilidad_v1() IS NOT NULL AS ok
UNION ALL SELECT 'horarios_publicos', public.lf_web_horarios_v1() IS NOT NULL;

SELECT (public.lf_web_horarios_v1()->>'activo') AS horario_activo,
       jsonb_array_length(public.lf_web_horarios_v1()->'dias') AS dias_semanales,
       jsonb_array_length(public.lf_web_horarios_v1()->'excepciones') AS dias_especiales;

-- Ambas lecturas directas siguen negadas para anon. Si alguna devuelve true,
-- revisar los permisos: el parche no concede SELECT a estas tablas.
SELECT has_table_privilege('anon','public.plato_stock_diario','SELECT') AS anon_puede_leer_stock,
       has_table_privilege('anon','public.plato_ingredientes','SELECT') AS anon_puede_leer_recetas;

SELECT proname AS rpc, prosecdef AS seguridad_del_propietario
FROM pg_proc JOIN pg_namespace n ON n.oid=pronamespace
WHERE n.nspname='public' AND proname IN (
'lf_web_disponibilidad_v1','lf_web_horarios_v1','lf_crear_reserva',
'lf_admin_excepciones_v1','lf_admin_guardar_excepcion_v1');
