# La Fonda — migración a React

Proyecto web migrado a una aplicación de página única (SPA) con React, Vite y React Router. Mantiene las rutas del sitio original, los recursos gráficos, las hojas de estilo y el contrato con Supabase. El frontend se ejecuta independiente de la aplicación de escritorio.

## Ejecutar en Visual Studio Code (Windows)

1. Descomprime `LaFonda-React.zip` y abre la carpeta `LaFonda-React` (donde está `package.json`). Conserva el proyecto anterior como respaldo.
2. Abre **Terminal > Nueva terminal**. Se recomienda Node.js 22 LTS. Comprueba `node -v` y `npm -v`.
3. Ejecuta:

```powershell
npm install
npm run dev
```

4. Abre la dirección que indique Vite, normalmente `http://localhost:5173/`.
5. Para comprobar las pruebas locales, sin realizar llamadas a Supabase:

```powershell
npm test
```

6. Para generar la versión de publicación y probarla localmente:

```powershell
npm run build
npm run preview
```

El resultado compilado estará en `dist/`. En Netlify ya se incluye `netlify.toml` (`npm run build`, directorio `dist`) y `public/_redirects` para mantener las rutas al actualizar el navegador. No uses Live Server directamente con el código fuente JSX. Si Supabase Auth restringe los orígenes o redirecciones de desarrollo, revisa la configuración con el responsable de la base; no cambies permisos o políticas de la aplicación de escritorio.

## Conexión a Supabase

El proyecto conserva la URL y la clave pública publishable original en `src/services/config.js`, de modo que no necesitas cambiar el esquema de base de datos. Si necesitas probar con otro proyecto de Supabase, copia `.env.example` a `.env` y configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Son valores públicos del navegador: **nunca uses una clave service_role, una clave secreta ni contraseñas en variables VITE_**.

No se ejecutó SQL, no se alteraron tablas, no se cambiaron políticas RLS y no se registraron pedidos reales durante esta entrega. Las operaciones web mantienen los 28 nombres RPC existentes y sus parámetros originales. Desde v2.0.11, la web no consulta directamente `plato_stock_diario` ni `plato_ingredientes` con el rol anon, para respetar los permisos de Supabase. El catálogo se consulta mediante `web_catalogo`; si esa RPC no incluye el stock diario, la web no podrá mostrar la cantidad real y la disponibilidad se validará definitivamente mediante las RPC de pedidos del servidor. Las funciones SQL existentes pueden efectuar escrituras internas propias de su operación; deben verificarse sus definiciones, permisos y comportamiento en el entorno real antes de publicar.

**No ejecutes los archivos de `referencia-sql/` para iniciar la web.** Son copias de los scripts de instalación/reversión aportados con el sistema antiguo, conservadas exclusivamente como referencia. No son migraciones nuevas ni se cargan desde Vite. Modificar o revertir esas funciones en la base compartida podría afectar a la aplicación de escritorio.

## Organización

```text
LaFonda-React/
├── index.html                  # Único documento de entrada
├── package.json
├── vite.config.js
├── netlify.toml
├── public/                     # CSS originales y las 17 imágenes WebP
│   ├── css/
│   ├── componentes/
│   ├── imagenes/
│   └── paginas/                # Hojas CSS (sin documentos HTML separados)
├── src/
│   ├── main.jsx                 # Inicio de React + BrowserRouter
│   ├── App.jsx                  # Navegación, carga, protección de admin
│   ├── routes.js                # Las 24 rutas originales y sus recursos
│   ├── components/              # Navbar.jsx y Footer.jsx
│   ├── pages/                   # Un componente de React por pantalla
│   ├── controllers/             # Controladores de dominio adaptados al ciclo de vida
│   ├── services/                # Supabase, autenticación, correo, stock e imágenes
│   └── runtime/                 # Montaje, limpieza y caché de recursos de ruta
├── tests/                       # Pruebas locales sin acceso a la base
├── docs/                        # Inventario, auditoría y resultados de pruebas
└── referencia-sql/              # SQL original, NO ejecutar automáticamente
```

## Qué cambió

- La navegación se gestiona con React Router y el historial del navegador. Se reconocen las rutas antiguas, incluidas las terminadas en `index.html`.
- La promoción, el catálogo, el carrito, los formularios, mapas y operaciones administrativas conservan sus controladores originales dentro de componentes React por ruta. No se sustituyeron por datos de ejemplo en la aplicación entregada. La estrategia es una migración de compatibilidad: los controladores complejos aún manipulan su DOM aislado, en vez de reescribir simultáneamente unas 20 000 líneas como hooks. El encabezado, pie e inicio/nosotros son JSX declarativo. Las demás pantallas están montadas en React, con plantillas y controladores encapsulados; es la base para refactorizar gradualmente a componentes declarativos sin modificar el contrato con Supabase.
- El encabezado React permanece montado: cambia enlace activo, menú móvil, desplegable y datos del usuario con el cambio de sesión o modo. El pie también permanece montado. Se han conservado clases, iconos y estructura visual.
- Se cargan los módulos de cada ruta bajo demanda, se precargan módulos/estilos al pasar el puntero o enfocar un enlace y se mantienen recursos en caché. No se reutilizan datos de stock obsoletos de forma deliberada. Leaflet se carga solo para las páginas con mapa, desde el paquete local de npm.
- Se eliminó la navegación HTML por `fetch`/reemplazo de documentos y los antiguos inicializadores globales. Al abandonar una ruta se eliminan eventos globales y temporizadores; los mapas se liberan. No se inicia una nueva RPC desde un controlador que ya se desmontó. Una operación ya enviada al servidor no se cancela retroactivamente ni se reintenta automáticamente.
- Se conservaron las 30 hojas CSS y las 17 imágenes WebP sin cambios de contenido (47 recursos comprobados byte a byte).
- Se endureció la validación de reservas locales (sesión de la pestaña, correo de la cuenta, cantidad entera de personas, fecha válida y longitud de comentario). Se mantuvieron las reglas de formularios, OTP, stock y pago originales. Se desactivó el autocompletado de tarjeta en el pago simulado.

## Estado y límites de esta entrega

Consulta `docs/AUDITORIA.md` para detalles de funcionalidades, seguridad y pruebas pendientes. El archivo CSV de base de datos recibido enumera columnas y tipos, no contiene cuerpos de funciones RPC, restricciones completas, políticas RLS ni datos. No permite certificar que una operación sea segura para la aplicación de escritorio.

Las 24 pantallas fueron inicializadas en Chromium atravesando los controladores adaptados, con respuestas vacías/simuladas, identidad de prueba y una interfaz de mapa simulada. Se comprobaron también cambio de pestaña de contacto, limpieza de eventos/temporizadores y rechazo de RPC iniciada después de desmontar. Las pruebas Node pasaron 4/4; se verificó sintaxis de JavaScript y de 29 archivos JSX. **No se pudo instalar npm ni compilar la aplicación real en el entorno de entrega porque el registro de npm no resolvía DNS.** No existe todavía una validación integral de React Router, Vite, Leaflet real, responsive visual ni acceso en vivo a Supabase. La primera ejecución de `npm install` en tu equipo generará el archivo de bloqueo de dependencias; consérvalo para futuras instalaciones. No publiques sobre el sistema anterior hasta completar las comprobaciones con datos controlados.


## Actualización de seguridad v2.0.10 (noviembre de 2026)

- Las contraseñas **no se guardan** en `sessionStorage` ni `localStorage`, ni se exponen en el perfil público de sesión. Las versiones antiguas del almacenamiento se limpian al abrir la web.
- Las RPC existentes todavía requieren correo y contraseña. Para no modificar sin pruebas la base de datos compartida, se conservan las credenciales **solo en memoria** mientras la pestaña está activa; al **recargar completamente la página se debe iniciar sesión de nuevo**. Es una mitigación temporal, no autenticación basada en tokens.
- Se restringen las URLs de imágenes de galería, se protege la precedencia de credenciales en llamadas administrativas y se agregan cabeceras de seguridad en Netlify.
- La política CSP se configura inicialmente en **Report-Only** para observar posibles bloqueos antes de imponerla. Requiere verificación en producción.
- `npm test` ejecuta pruebas funcionales y de seguridad; `npm run build` valida la compilación, y `npm audit` **con conexión a Internet** es necesario para consultar alertas de dependencias actualizadas.
- **Pendiente para una solución de autenticación definitiva:** diseñar sesiones/tokens validados por el servidor y actualizar las RPC de Supabase, tras revisar sus definiciones y el impacto en el sistema de escritorio. Las pruebas locales no sustituyen una auditoría de permisos/RLS ni un pentest de producción.

## Actualización v2.0.12 — Horarios, días especiales y disponibilidad

**Requisito de publicación:** antes de subir la nueva interfaz a Netlify, hacer copia de seguridad de la base de datos compartida, probar en un proyecto Supabase de pruebas y ejecutar manualmente desde SQL Editor `sql/01_v2.0.12_stock_horarios.sql`. Es una migración transaccional, pero **actualiza la función `lf_crear_reserva` y su restricción de horas**: revise el efecto sobre el sistema de escritorio antes de aplicarla. No se ejecuta automáticamente mediante `npm`.

Verificar con `sql/02_verificar_v2.0.12.sql`. La migración añade las RPC públicas `lf_web_disponibilidad_v1`, `lf_web_horarios_v1` (solo datos públicos), y las administrativas `lf_admin_excepciones_v1` y `lf_admin_guardar_excepcion_v1` (validan correo, contraseña y rol en el servidor). No concede lectura `SELECT` sobre `plato_stock_diario` ni `plato_ingredientes` al rol anon. La RPC pública usa la vista existente `vw_carta_stock_publico`; si esa vista es diferente o no existe, hay que reconciliar la migración con el esquema real **antes** de ejecutarla.

En Reservar se presentan ocho fechas (incluidos hoy y el mismo día de la semana siguiente) con una tarjeta compacta y selector de turnos de 30 minutos. La última reserva empieza 90 minutos antes del cierre del día. En Administrador → Configuración se conserva la edición del horario semanal y se agrega el formulario de días excepcionales/cierres. **No se comprueba ocupación de mesas** hasta integrar el módulo de escritorio. La función SQL valida las reglas horarias y los datos del cliente al crear reservas.

La carta ordena platos con disponibilidad confirmada al principio y agotados al final, desactivando el botón `+` cuando la RPC pública confirma que no hay stock. Al entrar, los botones permanecen deshabilitados mientras se actualiza el inventario; no se guardan estados frescos de inventario en la caché de la carta. Si la RPC de stock falla, la interfaz puede mostrar productos de disponibilidad desconocida; el checkout continúa validando stock antes del pedido. La validación de horario de pedidos en React usa la propiedad `horario` de `web_catalogo` y actualiza antes de pagar. **No se modificó ni auditó la implementación SQL de `web_crear_pedido`**: sus validaciones definitivas siguen siendo responsabilidad del servidor y requieren prueba integrada.

Verificar antes de publicar: `npm ci`, `npm test`, `npm run build`, `npm audit`, y después flujo real con cuentas de prueba: Carta → Carrito → pago de prueba, cierre temporal y día excepcional, reservar en límite horario, y comprobar en el escritorio. La ausencia de acceso a Supabase desde el entorno de construcción impide confirmar producción aquí.
