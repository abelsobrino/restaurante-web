LA FONDA - WEB

La Fonda (web) es la plataforma web de un restaurante que permite a los clientes consultar la carta, gestionar pedidos y realizar reservas. También incluye un panel de administración para gestionar información y operaciones de la web.

Funcionalidades

- Sitio público: inicio, nosotros, carta, galería, reseñas y contacto, con navegación fluida entre secciones.
- Cuentas de clientes: registro, inicio de sesión, verificación del correo mediante código OTP y recuperación de contraseña.
- Pedidos: carrito de compras, proceso de pedido, pantalla de pago, comprobante e historial de pedidos.
- Reservas: formulario de reserva y consulta de reservas del usuario.
- Administración: gestión de platos y combos, promociones, contenido, reportes y configuración.

Tecnologías

- HTML5 y CSS3: estructura, diseño adaptable y estilos.
- JavaScript: interactividad, validaciones, componentes y navegación dinámica.
- Supabase y PostgreSQL: persistencia de información y operaciones mediante funciones RPC.
- Supabase Auth y SMTP: envío y verificación de códigos por correo electrónico.
  El frontend está desarrollado con tecnologías web nativas, sin frameworks de JavaScript.

Estructura del proyecto

- index.html: página de inicio.
- componentes/: barra de navegación y pie de página reutilizables.
- css/: estilos generales y variables visuales.
- js/: configuración, conexión con Supabase, autenticación, sesión y navegación.
- paginas/: módulos de acceso, carta, pedidos, pagos, reservas, perfil y administración.
- imagenes/: recursos gráficos del restaurante.
- supabase/: scripts SQL de instalación, validación y reversión.

Instalación y ejecución

1. Clona o descarga el repositorio y abre la carpeta del proyecto en Visual Studio Code. https://github.com/abelsobrino/restaurante-web.git
2. Configura la URL del proyecto Supabase y su clave pública en js/config.js.
3. Prepara las funciones SQL necesarias de Supabase siguiendo los archivos de instalación incluidos. Para los correos OTP, configura Supabase Auth y el servicio SMTP.
4. Ejecuta el proyecto desde su carpeta raíz usando Live Server o un servidor HTTP local. Por ejemplo, con Python: python -m http.server 5500.
5. Abre http://localhost:5500 en el navegador.

Arquitectura
La aplicación utiliza un frontend modular organizado por páginas y componentes. JavaScript conecta la interfaz con Supabase mediante solicitudes HTTP y funciones RPC; PostgreSQL gestiona los datos y Supabase Auth interviene en la verificación por correo.

Estado
Proyecto académico en desarrollo. Antes de su uso en producción deben completarse las pruebas integrales del registro, la recuperación de cuentas, los permisos y el flujo de pedidos.


## Documentación técnica

El proyecto cuenta con documentación complementaria organizada por áreas técnicas para facilitar su comprensión y mantenimiento.

| Documento | Contenido |
|---|---|
| [Arquitectura técnica](docs/ARQUITECTURA.md) | Tecnologías, componentes y diagramas |
| [Implementación de interfaces](docs/INTERFACES.md) | UI/UX y componentes reutilizables |
| [Flujo de pedidos](docs/FLUJO_PEDIDOS.md) | Recorrido del cliente y operaciones |
| [Autenticación](docs/AUTENTICACION.md) | Registro, OTP y gestión de sesiones |
| [Integración de sistemas](docs/INTEGRACION.md) | Comunicación entre web, escritorio y PostgreSQL |

Esta documentación complementa el código fuente y puede actualizarse conforme evoluciona el proyecto.
