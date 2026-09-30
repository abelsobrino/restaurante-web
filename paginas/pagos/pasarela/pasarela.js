const CHECKOUT_KEY =
    "lafonda_checkout";

const CARRITO_KEY =
    "lafonda_carrito";

const COMPROBANTE_KEY =
    "lafonda_comprobante";

let checkoutActual =
    null;

function pagoDinero(valor) {

    return `S/ ${Number(
        valor || 0
    ).toFixed(2)}`;

}

function escaparPago(valor) {

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

function mostrarEstadoPago(
    mensaje,
    tipo = ""
) {

    const estado =
        document.getElementById(
            "pago-estado"
        );

    estado.textContent =
        mensaje;

    estado.className =
        "pago-estado";

    if (tipo) {

        estado.classList.add(
            tipo
        );

    }

}

function cargarCheckout() {

    try {

        const datos =
            JSON.parse(
                sessionStorage.getItem(
                    CHECKOUT_KEY
                ) || "null"
            );

        if (
            !datos ||
            !Array.isArray(
                datos.items
            ) ||
            !datos.items.length
        ) {

            return null;

        }

        return datos;

    }

    catch (error) {

        console.error(
            "Error leyendo checkout:",
            error
        );

        return null;

    }

}

function obtenerSesionPago() {

    if (
        !window.LaFondaAuth
    ) {

        return null;

    }

    const sesion =
        LaFondaAuth.getSession();

    if (
        !sesion ||
        sesion.rol !== "CLIENTE"
    ) {

        return null;

    }

    return sesion;

}

function renderizarCheckout() {

    const sesion =
        obtenerSesionPago();

    if (
        !checkoutActual ||
        !sesion
    ) {

        return;
    }

    const nombreCliente = [

        sesion.nombre || "",
        sesion.apellido || ""

    ]
        .join(" ")
        .trim() ||
        "Cliente";

    document.getElementById(
        "pago-cliente"
    ).textContent =
        nombreCliente;

    document.getElementById(
        "pago-titular"
    ).value =
        nombreCliente.toUpperCase();

    document.getElementById(
        "pago-productos"
    ).innerHTML =
        checkoutActual.items
            .map(
                producto => `

                    <div class="pago-producto">

                        <div class="pago-producto-info">

                            <strong>

                                ${escaparPago(
                                    producto.nombre ||
                                    "Producto"
                                )}

                            </strong>

                            <span>

                                ${Number(
                                    producto.cantidad ||
                                    1
                                )} ×

                                ${pagoDinero(
                                    producto.precio
                                )}

                            </span>

                        </div>

                        <span class="pago-producto-precio">

                            ${pagoDinero(
                                Number(
                                    producto.precio ||
                                    0
                                ) *
                                Number(
                                    producto.cantidad ||
                                    1
                                )
                            )}

                        </span>

                    </div>

                `
            )
            .join("");

    const esDelivery =
        checkoutActual.tipoEntrega ===
        "delivery";

    document.getElementById(
        "pago-entrega"
    ).textContent =

        esDelivery
            ? "Delivery"
            : "Recojo en tienda";

    document.getElementById(
        "pago-direccion-fila"
    ).hidden =
        !esDelivery;

    if (esDelivery) {

        document.getElementById(
            "pago-direccion"
        ).textContent =
            checkoutActual.direccion ||
            "-";

    }

    document.getElementById(
        "pago-comprobante"
    ).textContent =

        checkoutActual.comprobante ===
        "factura"

            ? "Factura"

            : "Boleta";

    const subtotal =
        Number(
            checkoutActual.subtotal ||
            0
        );

    const descuento =
        Number(
            checkoutActual.descuento ||
            0
        );

    const delivery =
        Number(
            checkoutActual.delivery ||
            0
        );

    const total =
        Number(
            checkoutActual.total ||
            subtotal -
            descuento +
            delivery
        );

    document.getElementById(
        "pago-subtotal"
    ).textContent =
        pagoDinero(
            subtotal
        );

    document.getElementById(
        "pago-descuento"
    ).textContent =
        `-${pagoDinero(
            descuento
        )}`;

    document.getElementById(
        "pago-descuento-fila"
    ).hidden =
        descuento <= 0;

    document.getElementById(
        "pago-delivery"
    ).textContent =
        pagoDinero(
            delivery
        );

    document.getElementById(
        "pago-delivery-fila"
    ).hidden =
        delivery <= 0;

    document.getElementById(
        "pago-total"
    ).textContent =
        pagoDinero(
            total
        );

}

function formatearTarjeta() {

    const input =
        document.getElementById(
            "pago-tarjeta"
        );

    const numeros =
        input.value
            .replace(/\D/g, "")
            .slice(
                0,
                16
            );

    input.value =
        numeros.replace(
            /(\d{4})(?=\d)/g,
            "$1 "
        );

    limpiarEstadoCampo(
        input
    );

}

function formatearVencimiento() {

    const input =
        document.getElementById(
            "pago-vencimiento"
        );

    const numeros =
        input.value
            .replace(/\D/g, "")
            .slice(
                0,
                4
            );

    input.value =

        numeros.length > 2

            ? `${numeros.slice(
                0,
                2
            )}/${numeros.slice(
                2
            )}`

            : numeros;

    limpiarEstadoCampo(
        input
    );

}

function formatearCvv() {

    const input =
        document.getElementById(
            "pago-cvv"
        );

    input.value =
        input.value
            .replace(/\D/g, "")
            .slice(
                0,
                4
            );

    limpiarEstadoCampo(
        input
    );

}

function formatearTitular() {

    const input =
        document.getElementById(
            "pago-titular"
        );

    input.value =
        input.value
            .toUpperCase();

    limpiarEstadoCampo(
        input
    );

}

function limpiarEstadoCampo(
    input
) {

    input.classList.remove(
        "invalido",
        "valido"
    );

}

function vencimientoValido(
    valor
) {

    if (
        !/^\d{2}\/\d{2}$/
            .test(valor)
    ) {

        return false;

    }

    const [
        mes,
        anio
    ] =
        valor
            .split("/")
            .map(Number);

    if (
        mes < 1 ||
        mes > 12
    ) {

        return false;

    }

    const ahora =
        new Date();

    const mesActual =
        ahora.getMonth() + 1;

    const anioActual =
        ahora.getFullYear() %
        100;

    return (

        anio > anioActual ||

        (
            anio === anioActual &&
            mes >= mesActual
        )

    );

}

function validarDatosPago() {

    const tarjeta =
        document.getElementById(
            "pago-tarjeta"
        );

    const vencimiento =
        document.getElementById(
            "pago-vencimiento"
        );

    const cvv =
        document.getElementById(
            "pago-cvv"
        );

    const titular =
        document.getElementById(
            "pago-titular"
        );

    const numerosTarjeta =
        tarjeta.value
            .replace(/\D/g, "");

    const numerosCvv =
        cvv.value
            .replace(/\D/g, "");

    if (
        numerosTarjeta.length !==
        16
    ) {

        tarjeta.classList.add(
            "invalido"
        );

        mostrarEstadoPago(
            "La tarjeta debe tener exactamente 16 dígitos.",
            "error"
        );

        tarjeta.focus();

        return false;

    }

    tarjeta.classList.add(
        "valido"
    );

    if (
        !vencimientoValido(
            vencimiento.value
        )
    ) {

        vencimiento.classList.add(
            "invalido"
        );

        mostrarEstadoPago(
            "La fecha de vencimiento no es válida.",
            "error"
        );

        vencimiento.focus();

        return false;

    }

    vencimiento.classList.add(
        "valido"
    );

    if (
        numerosCvv.length < 3 ||
        numerosCvv.length > 4
    ) {

        cvv.classList.add(
            "invalido"
        );

        mostrarEstadoPago(
            "El CVV debe contener 3 o 4 dígitos.",
            "error"
        );

        cvv.focus();

        return false;

    }

    cvv.classList.add(
        "valido"
    );

    if (
        titular.value
            .trim()
            .length < 3
    ) {

        titular.classList.add(
            "invalido"
        );

        mostrarEstadoPago(
            "Ingresa el nombre del titular.",
            "error"
        );

        titular.focus();

        return false;

    }

    titular.classList.add(
        "valido"
    );

    mostrarEstadoPago("");

    return true;

}

function crearItemsPedido() {

    return checkoutActual
        .items
        .map(
            producto => {

                const item = {

                    tipo:
                        producto.tipo,

                    id:
                        Number(
                            producto.id
                        ),

                    cantidad:
                        Number(
                            producto.cantidad ||
                            1
                        )

                };

                if (
                    producto.extra
                ) {

                    item.extra =
                        producto.extra;

                }

                return item;

            }
        );

}

function crearObservacion() {

    if (
        checkoutActual
            .comprobante ===
        "factura"
    ) {

        return (
            `Factura RUC ` +
            `${checkoutActual.ruc} - ` +
            `${checkoutActual.razonSocial}`
        );

    }

    return "Boleta web";

}

function guardarDatosComprobante(
    resultado,
    sesion
) {

    const comprobante = {

        pedido:
            resultado,

        cliente: {

            nombre:
                sesion.nombre ||
                "",

            apellido:
                sesion.apellido ||
                "",

            email:
                sesion.email ||
                "",

            telefono:
                sesion.telefono ||
                ""

        },

        items:
            checkoutActual.items,

        tipoEntrega:
            checkoutActual.tipoEntrega,

        direccion:
            checkoutActual.direccion,

        comprobante:
            checkoutActual.comprobante,

        ruc:
            checkoutActual.ruc ||
            "",

        razonSocial:
            checkoutActual.razonSocial ||
            "",

        subtotal:
            Number(
                checkoutActual.subtotal ||
                0
            ),

        descuento:
            Number(
                resultado?.descuento ??
                checkoutActual.descuento ??
                0
            ),

        delivery:
            Number(
                resultado?.costo_envio ??
                checkoutActual.delivery ??
                0
            ),

        total:
            Number(
                resultado?.total ??
                checkoutActual.total ??
                0
            ),

        fecha:
            new Date()
                .toISOString()

    };

    sessionStorage.setItem(
        COMPROBANTE_KEY,
        JSON.stringify(
            comprobante
        )
    );

}

async function validarHorarioAntesDePagar() {

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

    if (window.LaFondaStock) {

        const validacionStock =
            window.LaFondaStock.validarProductos(
                checkoutActual?.items || [],
                catalogo
            );

        if (!validacionStock.ok) {

            throw new Error(
                validacionStock.errores[0] ||
                "Hay productos sin stock suficiente. Regresa al carrito y actualiza tu pedido."
            );

        }

    }

    const horario =
        catalogo?.horario;

    if (
        !horario ||
        horario.abierto !== false
    ) {

        return true;

    }

    if (horario.cerrado_hoy) {

        throw new Error(
            "Hoy no atendemos. Vuelve a revisar mañana."
        );

    }

    throw new Error(
        `Cerrado por ahora. Abrimos hoy a las ${horario.hora_apertura}, ` +
        `hasta las ${horario.hora_cierre}.`
    );

}

async function registrarPedido() {

    const sesion =
        obtenerSesionPago();

    if (!sesion) {

        throw new Error(
            "Tu sesión ya no está disponible."
        );

    }

    return await LaFondaDB.rpc(
        "web_crear_pedido",
        {

            p_email:
                sesion.email,

            p_password:
                sesion.password,

            p_items:
                crearItemsPedido(),

            p_tipo:
                String(
                    checkoutActual
                        .tipoEntrega
                ).toUpperCase(),

            p_direccion:

                checkoutActual
                    .tipoEntrega ===
                "delivery"

                    ? checkoutActual
                        .direccion

                    : "Recojo en tienda",

            p_latitud:
                checkoutActual
                    .latitud ??
                null,

            p_longitud:
                checkoutActual
                    .longitud ??
                null,

            p_telefono:
                sesion.telefono ||
                "",

            p_cupon:
                checkoutActual
                    .cupon
                    ?.codigo ||
                null,

            p_observacion:
                crearObservacion()

        }
    );

}

async function prevalidarDisponibilidadPasarela() {

    if (
        !checkoutActual ||
        !window.LaFondaStock
    ) {

        return true;

    }

    try {

        const catalogo =
            await LaFondaDB.rpc(
                "web_catalogo",
                {}
            );

        if (
            window.LaFondaStock.enriquecerCatalogo
        ) {

            await window.LaFondaStock
                .enriquecerCatalogo(
                    catalogo
                );

        }

        const validacion =
            window.LaFondaStock
                .validarProductos(
                    checkoutActual.items || [],
                    catalogo
                );

        if (validacion.ok) {

            return true;

        }

        const mensaje =
            validacion.errores[0] ||
            "La disponibilidad cambió. Revisa tu carrito antes de pagar.";

        sessionStorage.setItem(
            "lafonda_stock_mensaje",
            mensaje
        );

        sessionStorage.removeItem(
            CHECKOUT_KEY
        );

        mostrarEstadoPago(
            mensaje,
            "error"
        );

        const boton =
            document.getElementById(
                "pago-boton"
            );

        if (boton) {

            boton.disabled = true;
            boton.textContent =
                "Revisar carrito";

        }

        setTimeout(
            () => {

                window.location.href =
                    "/paginas/pedidos/carrito/";

            },
            900
        );

        return false;

    }

    catch (error) {

        console.warn(
            "No se pudo prevalidar el stock. El servidor hará la validación final:",
            error
        );

        return true;

    }

}

async function realizarPago(
    evento
) {

    evento.preventDefault();

    if (
        !validarDatosPago()
    ) {

        return;

    }

    const sesion =
        obtenerSesionPago();

    if (!sesion) {

        sessionStorage.setItem(
            "lafonda_return_to",
            window.location.pathname
        );

        window.location.href =
            "/paginas/acceso/iniciar-sesion/";

        return;

    }

    const boton =
        document.getElementById(
            "pago-boton"
        );

    boton.disabled = true;

    boton.textContent =
        "Procesando pedido...";

    mostrarEstadoPago(
        "Registrando tu pedido..."
    );

    try {

        await validarHorarioAntesDePagar();

        const resultado =
            await registrarPedido();

        guardarDatosComprobante(
            resultado,
            sesion
        );

        sessionStorage.removeItem(
            CARRITO_KEY
        );

        sessionStorage.removeItem(
            CHECKOUT_KEY
        );

        mostrarEstadoPago(
            `Pedido ${
                resultado?.codigo ||
                ""
            } registrado correctamente.`,
            "exito"
        );

        setTimeout(
            () => {

                window.location.href =
                    "/paginas/pagos/boleta/";

            },
            500
        );

    }

    catch (error) {

        console.error(
            "Error registrando pedido:",
            error
        );

        const rechazoStock =
            window.LaFondaStock
                ?.registrarErrorServidor?.(
                    error,
                    checkoutActual?.items || []
                );

        if (rechazoStock?.esStock) {

            const mensaje =
                "La disponibilidad cambió en el sistema. " +
                "Regresamos al carrito para que revises los productos antes de volver a pagar.";

            sessionStorage.setItem(
                "lafonda_stock_mensaje",
                mensaje
            );

            sessionStorage.removeItem(
                CHECKOUT_KEY
            );

            mostrarEstadoPago(
                mensaje,
                "error"
            );

            boton.disabled = true;

            boton.textContent =
                "Revisar carrito";

            setTimeout(
                () => {

                    window.location.href =
                        "/paginas/pedidos/carrito/";

                },
                1100
            );

            return;

        }

        mostrarEstadoPago(
            error.message,
            "error"
        );

        boton.disabled = false;

        boton.textContent =
            "Pagar ahora";

    }

}

function validarAccesoPasarela() {

    const sesion =
        obtenerSesionPago();

    if (!sesion) {

        sessionStorage.setItem(
            "lafonda_return_to",
            window.location.pathname
        );

        window.location.href =
            "/paginas/acceso/iniciar-sesion/";

        return false;

    }

    checkoutActual =
        cargarCheckout();

    if (!checkoutActual) {

        window.location.href =
            "/paginas/pedidos/carrito/";

        return false;

    }

    return true;

}

function configurarEventosPago() {

    document.getElementById(
        "pago-tarjeta"
    ).addEventListener(
        "input",
        formatearTarjeta
    );

    document.getElementById(
        "pago-vencimiento"
    ).addEventListener(
        "input",
        formatearVencimiento
    );

    document.getElementById(
        "pago-cvv"
    ).addEventListener(
        "input",
        formatearCvv
    );

    document.getElementById(
        "pago-titular"
    ).addEventListener(
        "input",
        formatearTitular
    );

    document.getElementById(
        "pago-form"
    ).addEventListener(
        "submit",
        realizarPago
    );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (
            !validarAccesoPasarela()
        ) {

            return;

        }

        renderizarCheckout();

        const disponible =
            await prevalidarDisponibilidadPasarela();

        if (!disponible) {

            return;

        }

        configurarEventosPago();

    }
);