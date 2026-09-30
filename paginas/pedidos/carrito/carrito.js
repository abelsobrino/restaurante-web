const CARRITO_KEY =
    "lafonda_carrito";

const carritoState = {

    productos: [],

    catalogo: null,

    cupon: null,

    puntoDelivery: null,

    distanciaKm: 0,

    costoDelivery: 0,

    mapa: null,

    marcador: null

};

const MAXIMO_PRODUCTO = 10;

function carritoDinero(valor) {

    return `S/ ${Number(
        valor || 0
    ).toFixed(2)}`;

}

function escaparCarrito(valor) {

    return String(valor ?? "")
        .replace(
            /[&<>'"]/g,
            caracter => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"

            })[caracter]
        );

}

function validarStockProductoCarrito(producto, catalogo = carritoState.catalogo) {

    if (!catalogo || !window.LaFondaStock) {
        return { ok: true };
    }

    return window.LaFondaStock.validarProducto(
        producto,
        catalogo
    );

}

function validarStockCarrito(catalogo = carritoState.catalogo) {

    if (!catalogo || !window.LaFondaStock) {
        return { ok: true, errores: [] };
    }

    return window.LaFondaStock.validarProductos(
        carritoState.productos,
        catalogo
    );

}

async function refrescarYValidarStockCarrito() {

    const catalogo =
        await LaFondaDB.rpc(
            "web_catalogo",
            {}
        );

    if (
        window.LaFondaStock?.enriquecerCatalogo
    ) {

        await window.LaFondaStock
            .enriquecerCatalogo(
                catalogo
            );

    }

    carritoState.catalogo = catalogo;

    return validarStockCarrito(
        catalogo
    );

}

function normalizarProducto(
    producto
) {

    return {

        tipo:
            producto.tipo ||
            "PLATO",

        id:
            Number(
                producto.id || 0
            ),

        nombre:
            producto.nombre ||
            producto.name ||
            "Producto",

        precio:
            Number(
                producto.precio ??
                producto.price ??
                0
            ),

        imagen:
            producto.imagen ||
            producto.img ||
            "/imagenes/logo/logo.webp",

        cantidad:
            Number(
                producto.cantidad ??
                producto.qty ??
                1
            ),

        extra:
            producto.extra || "",

        clave:
            producto.clave ||
            producto.key ||
            `${producto.tipo || "PLATO"}:${producto.id}:${producto.extra || ""}`

    };

}

function cargarCarrito() {

    try {

        const datos =
            JSON.parse(
                sessionStorage.getItem(
                    CARRITO_KEY
                ) || "[]"
            );

        carritoState.productos =
            Array.isArray(datos)

                ? datos
                    .map(
                        normalizarProducto
                    )
                    .filter(
                        producto =>
                            producto.cantidad > 0
                    )

                : [];

    }

    catch (error) {

        console.error(
            "Error cargando carrito:",
            error
        );

        carritoState.productos = [];

    }

}

function guardarCarrito() {

    sessionStorage.setItem(
        CARRITO_KEY,
        JSON.stringify(
            carritoState.productos
        )
    );

}

function calcularSubtotal() {

    return carritoState
        .productos
        .reduce(

            (total, producto) =>

                total +
                producto.precio *
                producto.cantidad,

            0

        );

}

function obtenerDescuento() {

    return Number(
        carritoState.cupon
            ?.descuento || 0
    );

}

function calcularTotal() {

    return Math.max(

        0,

        calcularSubtotal() -
        obtenerDescuento() +
        carritoState.costoDelivery

    );

}

function invalidarCupon() {

    if (!carritoState.cupon) {
        return;
    }

    carritoState.cupon = null;

    const estado =
        document.getElementById(
            "coupon-status"
        );

    estado.className =
        "error";

    estado.textContent =
        "Vuelve a aplicar el cupón después de modificar el carrito.";

}

function renderizarCarrito() {

    const contenedor =
        document.getElementById(
            "carrito-productos"
        );

    const botonVaciar =
        document.getElementById(
            "carrito-vaciar"
        );

    if (
        !carritoState
            .productos
            .length
    ) {

        contenedor.innerHTML = `

            <div class="carrito-vacio">

                <span class="carrito-vacio-icono">
                    <i class="fa-solid fa-cart-shopping"></i>
                </span>

                <h2>
                    Tu carrito está vacío
                </h2>

                <p>
                    Agrega algunos platos desde
                    nuestra carta para continuar.
                </p>

                <a href="/paginas/menu/carta/">
                    Ver carta
                </a>

            </div>

        `;

        botonVaciar.hidden = true;

        actualizarResumen();

        return;

    }

    botonVaciar.hidden = false;

    contenedor.innerHTML =
        carritoState
            .productos
            .map(
                (producto, indice) => {

                    const validacionStock =
                        validarStockProductoCarrito(
                            producto
                        );

                    const sinStock =
                        !validacionStock.ok;

                    return `

                    <article class="carrito-producto${sinStock ? " sin-stock" : ""}">

                        <div class="carrito-producto-imagen">

                            <img
                                src="${escaparCarrito(
                                    producto.imagen
                                )}"
                                alt="${escaparCarrito(
                                    producto.nombre
                                )}"
                            >

                        </div>

                        <div class="carrito-producto-info">

                            <span class="carrito-producto-tipo">

                                ${escaparCarrito(
                                    producto.tipo
                                )}

                            </span>

                            <h3>

                                ${escaparCarrito(
                                    producto.nombre
                                )}

                            </h3>

                            ${sinStock ? `
                                <span class="carrito-stock-error">
                                    <i class="fa-solid fa-circle-exclamation"></i>
                                    ${escaparCarrito(validacionStock.mensaje || "Sin stock disponible")}
                                </span>
                            ` : ""}

                            <span class="carrito-producto-precio">

                                ${carritoDinero(
                                    producto.precio
                                )}

                            </span>

                        </div>

                        <div class="carrito-producto-control">

                            <div class="carrito-stepper">

                                <button
                                    type="button"
                                    data-accion="menos"
                                    data-indice="${indice}"
                                >
                                    −
                                </button>

                                <span>
                                    ${producto.cantidad}
                                </span>

                                <button
                                    type="button"
                                    data-accion="mas"
                                    data-indice="${indice}"
                                    ${sinStock ? "disabled" : ""}
                                >
                                    +
                                </button>

                            </div>

                            <span class="carrito-producto-subtotal">

                                ${carritoDinero(
                                    producto.precio *
                                    producto.cantidad
                                )}

                            </span>

                            <button
                                type="button"
                                class="carrito-eliminar"
                                data-eliminar="${indice}"
                            >
                                Eliminar
                            </button>

                        </div>

                    </article>

                `;
                }
            )
            .join("");

    configurarControlesProductos();

    actualizarResumen();

}

function configurarControlesProductos() {

    document
        .querySelectorAll(
            "[data-accion]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        const indice =
                            Number(
                                boton.dataset.indice
                            );

                        modificarCantidad(
                            indice,
                            boton.dataset.accion
                        );

                    }
                );

            }
        );

    document
        .querySelectorAll(
            "[data-eliminar]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        eliminarProducto(
                            Number(
                                boton.dataset.eliminar
                            )
                        );

                    }
                );

            }
        );

}

function modificarCantidad(
    indice,
    accion
) {

    const producto =
        carritoState
            .productos[indice];

    if (!producto) {
        return;
    }

    invalidarCupon();

    if (
        accion === "mas"
    ) {

        if (
            producto.cantidad >=
            MAXIMO_PRODUCTO
        ) {

            mostrarEstadoCarrito(
                `Máximo ${MAXIMO_PRODUCTO} unidades por producto.`,
                "error"
            );

            return;

        }

        const productoPrueba = {
            ...producto,
            cantidad: producto.cantidad + 1
        };

        const validacionStock =
            validarStockProductoCarrito(
                productoPrueba
            );

        if (!validacionStock.ok) {

            mostrarEstadoCarrito(
                validacionStock.mensaje ||
                "No hay stock suficiente para aumentar la cantidad.",
                "error"
            );

            return;

        }

        producto.cantidad++;

    }

    if (
        accion === "menos"
    ) {

        producto.cantidad--;

        if (
            producto.cantidad <= 0
        ) {

            carritoState
                .productos
                .splice(
                    indice,
                    1
                );

        }

    }

    guardarCarrito();

    renderizarCarrito();

}

function eliminarProducto(
    indice
) {

    invalidarCupon();

    carritoState
        .productos
        .splice(
            indice,
            1
        );

    guardarCarrito();

    renderizarCarrito();

}

function vaciarCarrito() {

    if (
        !carritoState
            .productos
            .length
    ) {

        return;

    }

    const confirmar =
        window.confirm(
            "¿Deseas vaciar todo el carrito?"
        );

    if (!confirmar) {
        return;
    }

    carritoState.productos = [];

    carritoState.cupon = null;

    carritoState.costoDelivery = 0;

    guardarCarrito();

    renderizarCarrito();

}

function actualizarResumen() {

    const subtotal =
        calcularSubtotal();

    const descuento =
        obtenerDescuento();

    const total =
        calcularTotal();

    const cantidad =
        carritoState
            .productos
            .reduce(
                (suma, producto) =>
                    suma +
                    producto.cantidad,
                0
            );

    document.getElementById(
        "carrito-contador"
    ).textContent =

        cantidad === 1

            ? "1 producto"

            : `${cantidad} productos`;

    document.getElementById(
        "resumen-subtotal"
    ).textContent =
        carritoDinero(
            subtotal
        );

    document.getElementById(
        "resumen-descuento"
    ).textContent =
        `-${carritoDinero(
            descuento
        )}`;

    document.getElementById(
        "resumen-descuento-fila"
    ).hidden =
        descuento <= 0;

    document.getElementById(
        "resumen-delivery"
    ).textContent =
        carritoDinero(
            carritoState.costoDelivery
        );

    document.getElementById(
        "resumen-delivery-fila"
    ).hidden =
        carritoState.costoDelivery <= 0;

    document.getElementById(
        "resumen-total"
    ).textContent =
        carritoDinero(total);

    const stockValido =
        validarStockCarrito();

    document.getElementById(
        "carrito-continuar"
    ).disabled =
        carritoState
            .productos
            .length === 0 ||
        !stockValido.ok;

}

async function cargarConfiguracionCarrito() {

    try {

        const catalogo =
            await LaFondaDB.rpc(
                "web_catalogo",
                {}
            );

        if (
            window.LaFondaStock?.enriquecerCatalogo
        ) {

            await window.LaFondaStock
                .enriquecerCatalogo(
                    catalogo
                );

        }

        carritoState.catalogo =
            catalogo;

        configurarMapa();

        renderizarCarrito();

    }

    catch (error) {

        console.error(
            "No se pudo cargar la configuración:",
            error
        );

        mostrarEstadoCarrito(
            "No se pudo cargar la configuración de la tienda.",
            "error"
        );

    }

}

function configurarMapa() {

    if (!window.L) {
        return;
    }

    const configuracion =
        carritoState.catalogo
            ?.delivery || {};

    const posicionInicial =

        configuracion.latitud != null &&
        configuracion.longitud != null

            ? [
                Number(
                    configuracion.latitud
                ),

                Number(
                    configuracion.longitud
                )
            ]

            : [
                -12.0464,
                -77.0428
            ];

    carritoState.mapa =
        L.map(
            "delivery-map"
        ).setView(
            posicionInicial,
            13
        );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 19,

            attribution:
                "© OpenStreetMap"

        }
    ).addTo(
        carritoState.mapa
    );

    carritoState.marcador =
        L.marker(
            posicionInicial,
            {
                draggable: true
            }
        ).addTo(
            carritoState.mapa
        );

    carritoState.marcador.on(
        "dragend",
        () => {

            const posicion =
                carritoState
                    .marcador
                    .getLatLng();

            establecerDelivery(
                posicion.lat,
                posicion.lng,
                true
            );

        }
    );

    carritoState.mapa.on(
        "click",
        evento => {

            establecerDelivery(
                evento.latlng.lat,
                evento.latlng.lng,
                true
            );

        }
    );

    alternarEntrega();

}

function calcularDistancia(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const radio =
        6371;

    const rad =
        numero =>
            numero *
            Math.PI /
            180;

    const diferenciaLat =
        rad(
            lat2 - lat1
        );

    const diferenciaLon =
        rad(
            lon2 - lon1
        );

    const valor =

        Math.sin(
            diferenciaLat / 2
        ) ** 2 +

        Math.cos(
            rad(lat1)
        ) *

        Math.cos(
            rad(lat2)
        ) *

        Math.sin(
            diferenciaLon / 2
        ) ** 2;

    return (
        radio *
        2 *
        Math.asin(
            Math.sqrt(valor)
        )
    );

}

async function establecerDelivery(
    latitud,
    longitud,
    buscarDireccion = false
) {

    carritoState.puntoDelivery = {

        lat:
            latitud,

        lng:
            longitud

    };

    carritoState.marcador
        ?.setLatLng(
            [
                latitud,
                longitud
            ]
        );

    const configuracion =
        carritoState.catalogo
            ?.delivery || {};

    if (
        configuracion.latitud != null &&
        configuracion.longitud != null
    ) {

        carritoState.distanciaKm =
            calcularDistancia(

                Number(
                    configuracion.latitud
                ),

                Number(
                    configuracion.longitud
                ),

                latitud,

                longitud

            );

        carritoState.costoDelivery =

            configuracion.activo

                ? Math.max(

                    Number(
                        configuracion
                            .tarifa_minima ||
                        0
                    ),

                    carritoState.distanciaKm *
                    Number(
                        configuracion
                            .precio_km ||
                        0
                    )

                )

                : 0;

        document.getElementById(
            "delivery-distance"
        ).textContent =

            configuracion.activo

                ? `${carritoState.distanciaKm.toFixed(2)} km · ${carritoDinero(
                    carritoState.costoDelivery
                )}`

                : "El delivery aún no está habilitado.";

    }

    if (buscarDireccion) {

        try {

            const respuesta =
                await fetch(

                    "https://nominatim.openstreetmap.org/reverse" +

                    `?format=jsonv2` +

                    `&lat=${encodeURIComponent(
                        latitud
                    )}` +

                    `&lon=${encodeURIComponent(
                        longitud
                    )}` +

                    "&accept-language=es"

                );

            const datos =
                await respuesta.json();

            if (
                datos.display_name
            ) {

                document.getElementById(
                    "customer-address"
                ).value =
                    datos.display_name;

            }

        }

        catch (error) {

            console.warn(
                "No se obtuvo la dirección:",
                error
            );

        }

    }

    actualizarResumen();

}

function alternarEntrega() {

    const delivery =
        document.getElementById(
            "delivery-type"
        ).value === "delivery";

    const seccion =
        document.getElementById(
            "delivery-section"
        );

    seccion.hidden =
        !delivery;

    document.getElementById(
        "customer-address"
    ).required =
        delivery;

    if (!delivery) {

        carritoState
            .puntoDelivery =
            null;

        carritoState
            .costoDelivery =
            0;

    }

    else {

        setTimeout(
            () =>
                carritoState.mapa
                    ?.invalidateSize(),
            100
        );

    }

    actualizarResumen();

}

function usarUbicacion() {

    if (
        !navigator.geolocation
    ) {

        mostrarEstadoCarrito(
            "Tu navegador no permite obtener la ubicación.",
            "error"
        );

        return;

    }

    navigator.geolocation
        .getCurrentPosition(

            posicion => {

                const lat =
                    posicion.coords
                        .latitude;

                const lng =
                    posicion.coords
                        .longitude;

                carritoState.mapa
                    ?.setView(
                        [lat, lng],
                        16
                    );

                establecerDelivery(
                    lat,
                    lng,
                    true
                );

            },

            error => {

                mostrarEstadoCarrito(
                    "No se pudo obtener tu ubicación: " +
                    error.message,
                    "error"
                );

            },

            {
                enableHighAccuracy:
                    true,

                timeout:
                    10000
            }

        );

}

async function aplicarCuponCarrito() {

    const codigo =
        document
            .getElementById(
                "coupon-input"
            )
            .value
            .trim()
            .toUpperCase();

    const estado =
        document.getElementById(
            "coupon-status"
        );

    if (!codigo) {

        carritoState.cupon =
            null;

        estado.textContent =
            "";

        actualizarResumen();

        return;

    }

    const sesion =
        LaFondaAuth.getSession();

    if (
        !sesion ||
        sesion.rol !== "CLIENTE"
    ) {

        estado.className =
            "error";

        estado.textContent =
            "Inicia sesión como cliente para utilizar cupones.";

        return;

    }

    try {

        const resultado =
            await LaFondaDB.rpc(
                "web_validar_cupon",
                {

                    p_email:
                        sesion.email,

                    p_password:
                        sesion.password,

                    p_codigo:
                        codigo,

                    p_subtotal:
                        calcularSubtotal()

                }
            );

        if (!resultado?.ok) {

            throw new Error(
                resultado?.mensaje ||
                "Cupón no válido."
            );

        }

        carritoState.cupon =
            resultado;

        estado.className =
            "exito";

        estado.textContent =
            `Cupón ${resultado.codigo} aplicado: -${carritoDinero(
                resultado.descuento
            )}`;

        actualizarResumen();

    }

    catch (error) {

        carritoState.cupon =
            null;

        estado.className =
            "error";

        estado.textContent =
            error.message;

        actualizarResumen();

    }

}

function alternarComprobante() {

    const factura =
        document.getElementById(
            "receipt-type"
        ).value === "factura";

    document.getElementById(
        "factura-section"
    ).hidden =
        !factura;

}

function mostrarEstadoCarrito(
    mensaje,
    tipo = ""
) {

    const estado =
        document.getElementById(
            "carrito-estado"
        );

    estado.textContent =
        mensaje;

    estado.className =
        "carrito-estado";

    if (tipo) {

        estado.classList.add(
            tipo
        );

    }

}

function carritoTiendaAbierta() {

    const horario =
        carritoState
            .catalogo
            ?.horario;

    return (
        !horario ||
        horario.abierto !== false
    );

}

function mensajeHorarioCarrito() {

    const horario =
        carritoState
            .catalogo
            ?.horario;

    if (!horario) {

        return "";

    }

    if (horario.cerrado_hoy) {

        return "Hoy no atendemos. Vuelve a revisar mañana.";

    }

    return (
        `Cerrado por ahora. Abrimos hoy a las ${horario.hora_apertura}, ` +
        `hasta las ${horario.hora_cierre}.`
    );

}

async function continuarAlPago(
    evento
) {

    evento.preventDefault();

    if (
        !carritoState
            .productos
            .length
    ) {

        mostrarEstadoCarrito(
            "El carrito está vacío.",
            "error"
        );

        return;

    }

    if (!carritoTiendaAbierta()) {

        mostrarEstadoCarrito(
            mensajeHorarioCarrito(),
            "error"
        );

        return;

    }

    try {

        const validacionStock =
            await refrescarYValidarStockCarrito();

        if (!validacionStock.ok) {

            renderizarCarrito();

            mostrarEstadoCarrito(
                validacionStock.errores[0] ||
                "Hay productos sin stock suficiente en tu carrito.",
                "error"
            );

            return;

        }

    }

    catch (error) {

        console.error(
            "No se pudo validar el stock antes de pagar:",
            error
        );

        mostrarEstadoCarrito(
            "No pudimos verificar el stock actual. Inténtalo nuevamente antes de continuar.",
            "error"
        );

        return;

    }

    const sesion =
        LaFondaAuth.getSession();

    if (!sesion) {

        sessionStorage.setItem(
            "lafonda_return_to",
            window.location.pathname
        );

        window.location.href =
            "/paginas/acceso/iniciar-sesion/";

        return;

    }

    if (
        sesion.rol !== "CLIENTE"
    ) {

        mostrarEstadoCarrito(
            "Debes utilizar una cuenta de cliente para realizar pedidos.",
            "error"
        );

        return;

    }

    const tipoEntrega =
        document.getElementById(
            "delivery-type"
        ).value;

    if (
        tipoEntrega === "delivery"
    ) {

        if (
            !carritoState
                .catalogo
                ?.delivery
                ?.activo
        ) {

            mostrarEstadoCarrito(
                "El servicio de delivery todavía no está habilitado.",
                "error"
            );

            return;

        }

        if (
            !carritoState
                .puntoDelivery
        ) {

            mostrarEstadoCarrito(
                "Selecciona tu ubicación exacta en el mapa.",
                "error"
            );

            return;

        }

        const direccion =
            document
                .getElementById(
                    "customer-address"
                )
                .value
                .trim();

        if (!direccion) {

            mostrarEstadoCarrito(
                "Ingresa una dirección.",
                "error"
            );

            return;

        }

    }

    const comprobante =
        document.getElementById(
            "receipt-type"
        ).value;

    let ruc = "";

    let razonSocial = "";

    if (
        comprobante === "factura"
    ) {

        ruc =
            document
                .getElementById(
                    "legal-ruc"
                )
                .value
                .trim();

        razonSocial =
            document
                .getElementById(
                    "legal-company"
                )
                .value
                .trim();

        if (
            !/^\d{11}$/.test(
                ruc
            )
        ) {

            mostrarEstadoCarrito(
                "El RUC debe tener 11 dígitos.",
                "error"
            );

            return;

        }

        if (!razonSocial) {

            mostrarEstadoCarrito(
                "Ingresa la razón social.",
                "error"
            );

            return;

        }

    }

    const pedido = {

        items:
            carritoState
                .productos
                .map(
                    producto => ({

                        tipo:
                            producto.tipo,

                        id:
                            producto.id,

                        nombre:
                            producto.nombre,

                        precio:
                            producto.precio,

                        cantidad:
                            producto.cantidad,

                        imagen:
                            producto.imagen,

                        extra:
                            producto.extra ||
                            null

                    })
                ),

        tipoEntrega,

        direccion:

            tipoEntrega ===
            "delivery"

                ? document
                    .getElementById(
                        "customer-address"
                    )
                    .value
                    .trim()

                : "Recojo en tienda",

        latitud:
            carritoState
                .puntoDelivery
                ?.lat ??
            null,

        longitud:
            carritoState
                .puntoDelivery
                ?.lng ??
            null,

        distanciaKm:
            carritoState
                .distanciaKm,

        cupon:
            carritoState
                .cupon,

        comprobante,

        ruc,

        razonSocial,

        subtotal:
            calcularSubtotal(),

        descuento:
            obtenerDescuento(),

        delivery:
            carritoState
                .costoDelivery,

        total:
            calcularTotal()

    };

    sessionStorage.setItem(
        "lafonda_checkout",
        JSON.stringify(pedido)
    );

    window.location.href =
        "/paginas/pagos/pasarela/";

}

function limitarRuc() {

    const input =
        document.getElementById(
            "legal-ruc"
        );

    input.value =
        input.value
            .replace(/\D/g, "")
            .slice(
                0,
                11
            );

}

function configurarEventosCarrito() {

    document.getElementById(
        "carrito-vaciar"
    ).addEventListener(
        "click",
        vaciarCarrito
    );

    document.getElementById(
        "delivery-type"
    ).addEventListener(
        "change",
        alternarEntrega
    );

    document.getElementById(
        "btn-my-location"
    ).addEventListener(
        "click",
        usarUbicacion
    );

    document.getElementById(
        "btn-apply-coupon"
    ).addEventListener(
        "click",
        aplicarCuponCarrito
    );

    document.getElementById(
        "receipt-type"
    ).addEventListener(
        "change",
        alternarComprobante
    );

    document.getElementById(
        "legal-ruc"
    ).addEventListener(
        "input",
        limitarRuc
    );

    document.getElementById(
        "carrito-form"
    ).addEventListener(
        "submit",
        continuarAlPago
    );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        cargarCarrito();

        configurarEventosCarrito();

        renderizarCarrito();

        await cargarConfiguracionCarrito();

        const mensajeStock =
            sessionStorage.getItem(
                "lafonda_stock_mensaje"
            );

        if (mensajeStock) {

            sessionStorage.removeItem(
                "lafonda_stock_mensaje"
            );

            mostrarEstadoCarrito(
                mensajeStock,
                "error"
            );

        }

    }
);