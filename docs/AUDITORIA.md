# Auditoría de migración — La Fonda

## Alcance

Se inspeccionaron las 27 plantillas HTML originales: 24 pantallas y 3 fragmentos compartidos (navbar, footer y menú admin). El proyecto contenía 33 archivos JavaScript, 30 CSS, 17 imágenes WebP y 4 scripts SQL. Se compararon las rutas, los recursos y las llamadas RPC antes y después. El CSV enumera 46 relaciones en el esquema `public` (incluidas vistas), además de otros esquemas de Supabase. No es una copia restaurable de la base ni una definición completa de sus restricciones y permisos.

| Módulo | Pantallas | Integración conservada |
|---|---:|---|
| Pública | Inicio, Nosotros, Carta, Galería, Reseñas, Contacto | Catálogo, contenido, cupones, horario y stock; reseñas y galería por RPC |
| Acceso | Login, Registro, Recuperación, Elección de modo | RPC de cuentas, correo OTP de Supabase Auth, sesiones y permisos originales |
| Pedidos | Carrito, Mis pedidos | Carrito `sessionStorage`, cupón, delivery/recojo, consulta de pedidos y validaciones de stock |
| Pagos | Pasarela, Boleta | Pedido por RPC, datos originales de comprobante, impresión; pago explícitamente simulado |
| Usuario | Perfil | Información de sesión y acciones preexistentes |
| Reservas | Nueva reserva, Mis reservas | Persistencia original en `localStorage`, validación y cancelación local |
| Admin | Panel, Menú, Gestión, Promociones, Contenido, Reportes, Configuración | Platos, combos, stock, cupones, moderación, horario, delivery y reportes; operaciones RPC originales y acceso protegido |

Total: 24 rutas. `inventario-rutas.json` relaciona cada ruta con el HTML original, los controladores y los estilos. `inventario-rpc.json` enumera todas las RPC detectadas y las 46 relaciones públicas descritas por el CSV.

## Contrato de base de datos y protección de escritorio

| Operación | Funciones/recursos | Decisión |
|---|---|---|
| Catálogo y disponibilidad | `web_catalogo`, `plato_stock_diario`, `plato_ingredientes` | Lecturas existentes, sin escrituras directas nuevas |
| Cuentas | `web_login`, `web_registrar_cliente_validado`, `web_confirmar_registro_cliente`, `web_restablecer_contrasena_cliente`; Auth OTP | Mismos parámetros y tokens |
| Pedidos | `web_crear_pedido`, `web_mis_pedidos`, `web_validar_cupon` | Mantener validación y envío por RPC; no crear, actualizar ni borrar tablas manualmente |
| Reseñas y galería | `web_resenas_publicas`, `web_pedidos_resenables`, `web_crear_resena`, `web_galeria_publica`, `web_enviar_foto` | Mismo contrato |
| Administración | 15 RPC `web_admin_*` | No agregar operaciones directas sobre inventario, caja, compras, usuarios ni contabilidad |

Las RPC pueden afectar tablas compartidas por diseño; por ejemplo, los pedidos podrían actualizar stock mediante reglas del servidor. No se conocen sus cuerpos completos. La migración no afirma que no tengan efectos en escritorio cuando se usan desde producción, solo que no incorpora nuevas operaciones de base ni modificó el esquema. No se accedió al servicio remoto durante la revisión/pruebas.

## Hallazgos originales y decisiones

1. **Navegación:** el sitio ya tenía un mecanismo SPA parcial mediante `transiciones.js` que solo contemplaba algunas páginas públicas. Las otras acciones y el administrador recargaban documentos. Se reemplazó por rutas React en todos los módulos. En navegación inicial se necesitan descargar los recursos; después se reutilizan módulos y estilos. No se ha medido un aumento de velocidad con Lighthouse u otro benchmark.
2. **Reservas:** ambos controladores usaban `localStorage` y no consultaban Supabase. No aparece una tabla dedicada `reservas` en el CSV. Se conserva la persistencia existente y se informa que guardar localmente no confirma con el restaurante. Se exige el correo coincidente de la cuenta, número entero de sillas y fechas válidas. Las reservas anteriores siguen usando la misma clave. Una reserva local no es una garantía de mesa ni de disponibilidad real.
3. **Contacto:** el formulario original valida y muestra éxito después de un temporizador, pero no tiene RPC ni servidor receptor. Se mantuvo el flujo de validación, con mensaje transparente de que no existe envío remoto. No se creó tabla ni se reutilizó una ajena. El contacto y las reseñas son distintas funciones: las reseñas sí tienen RPC.
4. **Contraseñas:** el protocolo web original conserva la contraseña de sesión en `sessionStorage` y la envía a varias RPC como `p_password`. Se mantuvo por compatibilidad; es deuda de seguridad. Además, el SQL original de recuperación contiene una rama que puede almacenar el valor sin hash al detectar un formato legado; no se ejecutó ni modificó. Recomendación: migrar autenticación con acceso temporal y validar el hash del servidor mediante una intervención coordinada con escritorio, revisar RLS y permisos de cada RPC. La protección de rutas en React no sustituye el control de autorización en Supabase. No usar CSP restrictiva sin probar Leaflet y recursos actuales. La copia no incluye `.git` ni `VALIDACION.md`, porque este último contenía credenciales de prueba en texto claro; cámbialas si son válidas en producción.
5. **Pago:** el sitio ya señala que es un simulador y la RPC de pedido no envía datos de tarjeta. Se mantuvo la validación original y desactivó el autocompletado. No usar tarjetas reales. No se integró un procesador de pagos ni se certificó que la boleta sea un comprobante fiscal.
6. **Compatibilidad React:** para no arriesgar las reglas operativas, se encapsularon los controladores con DOM imperativo en una isla por pantalla. React gestiona el shell, rutas y ciclo de vida. Esto no es una reescritura declarativa del total del JavaScript. Los datos de carrito se mantienen en la misma clave de `sessionStorage`; por tanto sobreviven a navegación y recarga en la pestaña, no se prometen tras cerrarla.
7. **Estilo responsive:** se conservaron las 30 hojas de estilo y 17 imágenes idénticas. Se mantienen los puntos de corte originales. El menú móvil React controla `aria-expanded`. Se respetan clases y estructura; la comparación visual completa en un navegador ejecutando React/Vite queda pendiente. Las fuentes/iconos y teselas del mapa externos siguen dependiendo de internet.
8. **Operaciones en curso:** desmontar elimina timers y listeners, protege el inicio de nuevas RPC desde una ruta antigua y evita que redirecciones tardías de ese controlador cambien la pantalla. Las RPC ya recibidas por Supabase pueden completar; no se reintentan ni se revierte automáticamente el servidor. Antes de producción conviene probar navegación durante operaciones críticas, especialmente checkout y cambios administrativos.

## Pruebas ejecutadas

- Verificación de 24 alias y archivos de rutas, 7 admin, las 28 RPC originales y sus recursos.
- 47 recursos visuales idénticos a los del ZIP original mediante comparación de bytes.
- `node --check` de JS, análisis de 29 archivos JSX con TypeScript (sin diagnósticos de sintaxis).
- `npm test`: 4 pruebas, 4 aprobadas, sin dependencias instaladas y sin red.
- Chromium: inicialización aislada de los controladores de las 24 pantallas, usando las plantillas originales/adaptadas, un adaptador de almacenamiento de prueba y respuestas RPC no reales. Se simuló la API Leaflet. Sin errores de inicialización tras ajustar la prueba de stock con el servicio original y `fetch` simulado. La pasarela sin checkout redirigió al carrito como estaba previsto. El archivo `pruebas-controladores.json` recoge los resultados por pantalla. Esta comprobación no ejecuta React Router ni el bundle de Vite.
- Chromium: al remontar Contacto funciona el segundo tab y no se disparan listener, timer o RPC tardíos del controlador ya desmontado (`pruebas-ciclo-vida.json`).
- `npm install` / `npm run build`: no comprobados. El registro de npm no era accesible (EAI_AGAIN de DNS), por lo que tampoco se generó `package-lock.json` ni `dist/`. Se requiere conexión en el equipo del usuario.

## Checklist de aceptación antes de reemplazar el sitio publicado

Ejecuta `npm install`, `npm run dev`, `npm test` y `npm run build`. Utiliza datos de prueba, preferiblemente una copia o un entorno aislado de Supabase.

- [ ] Inicio > carta > nosotros > galería > reseñas > contacto; volver/avanzar del navegador y recargar una ruta profunda. Confirmar que el encabezado no se remonta.
- [ ] Login correcto/incorrecto, registro con código OTP válido/inválido, expiración/reenviar y recuperación de contraseña.
- [ ] Encabezado con sesión y sin sesión, cerrar sesión, abrir/cerrar menú móvil, perfil e historial de pedidos/reservas.
- [ ] Carta real: filtros, variantes/porciones, combos, límite de cantidades, stock agotado, cupones y horario. Mantener carrito al cambiar de sección y recargar.
- [ ] Carrito: sumar/restar, eliminar, vaciar, delivery/recojo, mapa, radio, costo, RUC y factura. Verificar stock antes de pago.
- [ ] Pasarela simulada con datos ficticios: validaciones, registro de un único pedido, comprobante/impresión e historial. Verificar que no se duplican pedidos al cambiar de ruta y que escritorio ve los datos esperados. No efectuar este flujo contra producción sin autorización.
- [ ] Reseñas de un pedido elegible, imágenes de galería, moderación y errores de servicio.
- [ ] Reserva local: fecha pasada, correo distinto, sillas inválidas, horario, duplicados y cancelación. Contacto: confirmación transparente de que no hay envío remoto.
- [ ] Admin: acceso con usuario normal rechazado; cambio de modo, resumen, menú, gestión, promociones, contenido, reportes, configuración de horario y delivery. Revisar operaciones de escritura en una base de prueba.
- [ ] Revisar a 360, 390, 768 y 1440 px; menú móvil, modales, carrito, tablas administrativas, impresión de boleta, mapas y scroll.
- [ ] Inspeccionar consola y red: sin recarga completa durante navegación, sin RPC nuevas inesperadas, sin datos sensibles en solicitudes externas.
- [ ] Medir primera carga y navegación con DevTools/Lighthouse y comparar con la versión original. Los resultados dependen de la velocidad de red, datos y recursos.

Si todo funciona, publicar `dist/` por Netlify en un despliegue de prueba y después realizar el reemplazo controlado. El original debe seguir disponible como respaldo hasta completar la aceptación.
