# La Fonda Web v2.0.14 — Calidad y seguridad de código

## Alcance

Se parte de v2.0.13 y de `Sonar-Parte3.json` con 221 hallazgos abiertos. Las correcciones están orientadas a preservar interfaz, navegación, pedidos, reservas y RPC existentes.

### Cambios realizados

- **Fiabilidad**: `String.codePointAt()` en la rutina de la Carta (el único aviso de fiabilidad clasificado por el informe).
- **Mantenibilidad**: lectura de horarios y notificaciones simplificada, mejora del recorrido de CSS, bloques condicionales explícitos y uso de Set para la selección de días.
- **Accesibilidad**: avisos semánticos con `<output>` y preferencia de reducción de movimiento; sin cambios de animación para usuarios que no la activan.
- **Estándares**: expresiones regulares, un fragmento JSX innecesario, y CSS de ajuste de palabras.
- **Datos**: no se aplican cambios de esquema, SQL ni privilegios a Supabase.

### Hallazgos no reescritos automáticamente

- Los avisos SQL `plsql:S1192` de `tests/fixtures/sql/` pertenecen a material de pruebas: recomendable clasificarlos como **archivos de prueba**, no como código de producción. Mantenerlos sin cambios para preservar contratos e historial.
- Los de `sql/01_v2.0.12_stock_horarios.sql` se mantienen intactos por la compatibilidad compartida con escritorio y PostgreSQL.
- Para los avisos de contraste CSS se requiere inspección visual de los fondos reales; no es responsable alterar indiscriminadamente la paleta.
- La complejidad de los controladores se reducirá solo con pruebas de integración de flujos completos, no mediante cambios semánticos automáticos.

## Verificaciones

- **Pruebas Node.js:** 76/76 aprobadas sobre el proyecto actualizado.
- **Sintaxis JS/MJS:** 41 archivos comprobados con `node --check`, 0 errores.
- **CSS:** 33 hojas parseadas, 0 errores de análisis.
- **Generador de estilos:** se regeneró `src/styles/route-pages.css` a partir de los CSS fuente.
- **SQL:** archivos `sql/` y `tests/fixtures/sql/` conservados byte a byte, sin cambio de funciones ni permisos.
- **Compilación Vite:** pendiente de comprobar en el equipo del usuario. En este entorno `npm ci` no pudo descargar todas las dependencias y `vite` no estaba instalado; el comando devolvió `vite: not found`. Esto no equivale a un fallo del código.
- **Integración real:** pendientes las pruebas con Supabase y el navegador.

## Evidencia SonarQube

El JSON original contenía **221 hallazgos OPEN**: 1 aviso de fiabilidad (LOW) y 221 impactos de mantenibilidad (algunos avisos afectan más de una calidad). Se atendió el aviso `javascript:S7758` con `codePointAt`, se simplificaron condicionales, se actualizaron colores de contraste en etiquetas y se modernizaron expresiones regulares y CSS. Los 23 hallazgos SQL de literales repetidos se conservaron intencionalmente, y se mantuvieron intactas las migraciones porque están compartidas con escritorio.

Para interpretar los resultados correctamente, en SonarQube verifique el **commit exacto** de v2.0.14: los indicadores de la versión anterior no son prueba de la nueva. Excluir `tests/fixtures/**` del análisis de *código de producción* es justificable porque contienen referencias para las pruebas, pero no se debe excluir código propio para ocultar problemas.

**No se afirma que los 221 avisos se hayan eliminado**, ni que todos los flujos estén verificados en producción. El número real tras la corrección depende del análisis SonarQube Cloud de v2.0.14.

## Publicación

No publicar automáticamente: verificar primero los flujos críticos y confirmar luego el commit analizado por SonarQube Cloud. El número de problemas finales no puede conocerse hasta el análisis de este commit.
