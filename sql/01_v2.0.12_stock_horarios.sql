-- LA FONDA v2.0.12 — Ejecutar SOLO EN EL SQL EDITOR DE SUPABASE.
-- Revise primero en un proyecto de pruebas. Hace backup de la función de reservas
-- y comprueba que los objetos previos existen antes de modificar permisos o lógica.
-- No da SELECT de las tablas internas al rol anon y no altera los pedidos existentes.
BEGIN;
DO $$
BEGIN
  IF to_regclass('public.vw_carta_stock_publico') IS NULL THEN
    RAISE EXCEPTION 'Falta la vista vw_carta_stock_publico: revisar instalación y esquema real';
  END IF;
  IF to_regclass('public.horario_negocio') IS NULL OR to_regclass('public.configuracion_negocio') IS NULL THEN
    RAISE EXCEPTION 'Falta horario_negocio o configuracion_negocio';
  END IF;
  IF to_regclass('public.reservas_web') IS NULL OR
     to_regprocedure('public.lf_crear_reserva(text,text,text,text,date,time without time zone,integer,text)') IS NULL OR
     to_regprocedure('public.lf_reserva_cliente(text,text)') IS NULL THEN
    RAISE EXCEPTION 'Faltan reservas_web / lf_crear_reserva / lf_reserva_cliente de la versión anterior';
  END IF;
END $$;

-- Solo id y disponibilidad pública del plato; la función se ejecuta con permisos
-- del propietario. No entrega ingredientes, reservas de inventario ni movimientos.
CREATE OR REPLACE FUNCTION public.lf_web_disponibilidad_v1() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
     'id', plato_id, 'stock_hoy', stock_hoy,
     'disponible_hoy', disponible_hoy
 ) ORDER BY plato_id), '[]'::jsonb)
 FROM public.vw_carta_stock_publico;
$$;
REVOKE ALL ON FUNCTION public.lf_web_disponibilidad_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lf_web_disponibilidad_v1() TO anon, authenticated;

-- Sólo excepciones explícitas de días concretos; las semanas regulares siguen
-- administrándose mediante el panel existente (web_admin_guardar_horario).
CREATE TABLE IF NOT EXISTS public.lf_horarios_especiales (
 fecha date PRIMARY KEY,
 hora_apertura time NOT NULL DEFAULT '10:00',
 hora_cierre time NOT NULL DEFAULT '23:00',
 cerrado boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lf_horarios_especiales_horas_chk CHECK (cerrado OR hora_cierre > hora_apertura)
);
ALTER TABLE public.lf_horarios_especiales ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lf_horarios_especiales FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.lf_web_horarios_v1() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
 SELECT jsonb_build_object(
  'activo', coalesce((SELECT horario_activo FROM public.configuracion_negocio ORDER BY id LIMIT 1),true),
  'dias', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'dia_semana', dia_semana, 'hora_apertura', to_char(hora_apertura,'HH24:MI'),
      'hora_cierre', to_char(hora_cierre,'HH24:MI'), 'cerrado', cerrado
    ) ORDER BY dia_semana) FROM public.horario_negocio), '[]'::jsonb),
  'excepciones', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'fecha', fecha, 'hora_apertura', to_char(hora_apertura,'HH24:MI'),
      'hora_cierre', to_char(hora_cierre,'HH24:MI'), 'cerrado', cerrado
    ) ORDER BY fecha) FROM public.lf_horarios_especiales
    WHERE fecha BETWEEN (now() AT TIME ZONE 'America/Lima')::date
      AND (now() AT TIME ZONE 'America/Lima')::date + 365),'[]'::jsonb)
 );
$$;
REVOKE ALL ON FUNCTION public.lf_web_horarios_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lf_web_horarios_v1() TO anon, authenticated;

-- No confiar en un rol comunicado por el navegador; volver a consultar web_login.
CREATE OR REPLACE FUNCTION public.lf_admin_autorizar_horario_v1(p_email text, p_password text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, extensions
AS $$
DECLARE v jsonb;
BEGIN
 IF nullif(trim(coalesce(p_email,'')),'') IS NULL OR nullif(p_password,'') IS NULL THEN
  RAISE EXCEPTION 'Sesión de administrador inválida';
 END IF;
 v := to_jsonb(public.web_login(p_email => trim(p_email), p_password => p_password));
 IF coalesce(v->>'ok','false') <> 'true' OR upper(coalesce(v->>'rol','')) <> 'ADMIN' THEN
  RAISE EXCEPTION 'Solo un administrador puede configurar días especiales';
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.lf_admin_autorizar_horario_v1(text,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.lf_admin_excepciones_v1(p_email text,p_password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, extensions
AS $$
BEGIN
 PERFORM public.lf_admin_autorizar_horario_v1(p_email,p_password);
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('fecha',fecha,
   'hora_apertura',to_char(hora_apertura,'HH24:MI'),'hora_cierre',to_char(hora_cierre,'HH24:MI'),
   'cerrado',cerrado) ORDER BY fecha),'[]'::jsonb)
   FROM public.lf_horarios_especiales WHERE fecha >= (now() AT TIME ZONE 'America/Lima')::date);
END $$;
REVOKE ALL ON FUNCTION public.lf_admin_excepciones_v1(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lf_admin_excepciones_v1(text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.lf_admin_guardar_excepcion_v1(
 p_email text,p_password text,p_fecha date,p_cerrado boolean,
 p_hora_apertura time,p_hora_cierre time,p_borrar boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, extensions
AS $$
BEGIN
 PERFORM public.lf_admin_autorizar_horario_v1(p_email,p_password);
 IF p_fecha IS NULL OR p_fecha < (now() AT TIME ZONE 'America/Lima')::date THEN
  RAISE EXCEPTION 'Selecciona una fecha futura o de hoy';
 END IF;
 IF coalesce(p_borrar,false) THEN
  DELETE FROM public.lf_horarios_especiales WHERE fecha=p_fecha;
  RETURN true;
 END IF;
 IF p_hora_apertura IS NULL OR p_hora_cierre IS NULL OR
    (NOT coalesce(p_cerrado,false) AND p_hora_cierre <= p_hora_apertura) THEN
  RAISE EXCEPTION 'Horario especial inválido';
 END IF;
 INSERT INTO public.lf_horarios_especiales(fecha,hora_apertura,hora_cierre,cerrado,updated_at)
 VALUES(p_fecha,p_hora_apertura,p_hora_cierre,coalesce(p_cerrado,false),now())
 ON CONFLICT(fecha) DO UPDATE SET hora_apertura=EXCLUDED.hora_apertura,
 hora_cierre=EXCLUDED.hora_cierre,cerrado=EXCLUDED.cerrado,updated_at=now();
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.lf_admin_guardar_excepcion_v1(text,text,date,boolean,time,time,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lf_admin_guardar_excepcion_v1(text,text,date,boolean,time,time,boolean) TO anon, authenticated;

-- Verificación de apertura, horario especial y duración de 90 minutos.
CREATE OR REPLACE FUNCTION public.lf_reserva_horario_valido_v1(p_fecha date,p_hora time)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE apertura time; cierre time; cerrado boolean; activo boolean;
BEGIN
 IF p_fecha IS NULL OR p_hora IS NULL OR
   p_fecha + p_hora <= (now() AT TIME ZONE 'America/Lima') THEN RETURN false; END IF;
 IF EXTRACT(MINUTE FROM p_hora)::int % 30 <> 0 OR EXTRACT(SECOND FROM p_hora) <> 0 THEN RETURN false; END IF;
 SELECT coalesce(horario_activo,true) INTO activo FROM public.configuracion_negocio ORDER BY id LIMIT 1;
 IF activo = false THEN RETURN false; END IF;
 SELECT e.hora_apertura,e.hora_cierre,e.cerrado INTO apertura,cierre,cerrado
   FROM public.lf_horarios_especiales e WHERE e.fecha=p_fecha;
 IF NOT FOUND THEN
   SELECT h.hora_apertura,h.hora_cierre,h.cerrado INTO apertura,cierre,cerrado
     FROM public.horario_negocio h WHERE h.dia_semana=EXTRACT(ISODOW FROM p_fecha)::smallint;
 END IF;
 IF apertura IS NULL OR cierre IS NULL OR coalesce(cerrado,true) THEN RETURN false; END IF;
 RETURN p_hora >= apertura AND cierre > apertura AND
   EXTRACT(EPOCH FROM p_hora) + 90 * 60 <= EXTRACT(EPOCH FROM cierre);
END $$;
REVOKE ALL ON FUNCTION public.lf_reserva_horario_valido_v1(date,time) FROM PUBLIC, anon, authenticated;

-- La función de la versión anterior usa '12:00 a 23:00' tanto en el CHECK de
-- la tabla como en SQL. Se sustituye la validación por la configuración REAL.
ALTER TABLE public.reservas_web DROP CONSTRAINT IF EXISTS reservas_web_hora_check;

CREATE OR REPLACE FUNCTION public.lf_crear_reserva(
 p_email text,p_password text,p_nombre text,p_telefono text,p_fecha date,
 p_hora time,p_personas integer,p_descripcion text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public,extensions
AS $$
DECLARE c bigint; r bigint;
BEGIN
 c := public.lf_reserva_cliente(p_email,p_password);
 IF p_fecha IS NULL OR p_hora IS NULL OR p_personas IS NULL OR p_personas NOT BETWEEN 1 AND 20 OR
    p_nombre IS NULL OR char_length(trim(p_nombre)) NOT BETWEEN 3 AND 100 OR
    p_telefono IS NULL OR trim(p_telefono) !~ '^[0-9]{7,15}$' OR
    char_length(coalesce(trim(p_descripcion),'')) > 500 THEN
  RAISE EXCEPTION 'Revisa los datos obligatorios de la reserva';
 END IF;
 IF NOT public.lf_reserva_horario_valido_v1(p_fecha,p_hora) THEN
  RAISE EXCEPTION 'Reserva fuera del horario disponible. Revisa el día, los turnos de 30 minutos y el límite de 90 minutos antes del cierre.';
 END IF;
 INSERT INTO public.reservas_web(cliente_id,nombre,telefono,fecha,hora,personas,descripcion)
 VALUES (c,trim(p_nombre),trim(p_telefono),p_fecha,p_hora,p_personas,coalesce(trim(p_descripcion),'')) RETURNING id INTO r;
 RETURN r;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Ya tienes una reserva activa para esta fecha y hora';
END $$;
REVOKE ALL ON FUNCTION public.lf_crear_reserva(text,text,text,text,date,time,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lf_crear_reserva(text,text,text,text,date,time,integer,text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
