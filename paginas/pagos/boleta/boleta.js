const COMPROBANTE_KEY =
    "lafonda_comprobante";

let comprobanteActual =
    null;

function comprobanteDinero(
    valor
) {

    return `S/ ${Number(
        valor || 0
    ).toFixed(2)}`;

}

function escaparComprobante(
    valor
) {

    return String(
        valor ?? ""
    ).replace(
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

function cargarComprobante() {

    try {

        const datos =
            sessionStorage.getItem(
                COMPROBANTE_KEY
            );

        if (!datos) {

            return null;

        }

        const comprobante =
            JSON.parse(datos);

        if (
            !comprobante ||
            !Array.isArray(
                comprobante.items
            )
        ) {

            return null;

        }

        return comprobante;

    }

    catch (error) {

        console.error(
            "Error leyendo comprobante:",
            error
        );

        return null;

    }

}

function formatearFechaComprobante(
    valor
) {

    const fecha =
        valor
            ? new Date(valor)
            : new Date();

    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return {
            fecha:
                "-",

            hora:
                "-"
        };

    }

    return {

        fecha:
            fecha.toLocaleDateString(
                "es-PE",
                {
                    day:
                        "2-digit",

                    month:
                        "2-digit",

                    year:
                        "numeric"
                }
            ),

        hora:
            fecha.toLocaleTimeString(
                "es-PE",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"
                }
            )

    };

}

function generarSerieComprobante(
    comprobante
) {

    const tipo =
        String(
            comprobante.comprobante ||
            "boleta"
        ).toLowerCase();

    const codigo =
        comprobante
            .pedido
            ?.codigo ||
        comprobante
            .pedido
            ?.id ||
        Date.now();

    const numeros =
        String(codigo)
            .replace(
                /\D/g,
                ""
            ) ||
        String(Date.now());

    const correlativo =
        numeros
            .slice(-6)
            .padStart(
                6,
                "0"
            );

    const prefijo =
        tipo === "factura"
            ? "FFF"
            : "BBB";

    return (
        `${prefijo}-${correlativo}`
    );

}

function obtenerTipoDocumento(
    comprobante
) {

    return (
        String(
            comprobante.comprobante ||
            "boleta"
        ).toLowerCase() ===
        "factura"
    )
        ? "FACTURA"
        : "BOLETA";

}

function obtenerNombreCliente(
    comprobante
) {

    if (
        obtenerTipoDocumento(
            comprobante
        ) === "FACTURA"
    ) {

        return (
            comprobante
                .razonSocial ||
            "Cliente"
        );

    }

    const cliente =
        comprobante.cliente ||
        {};

    return [

        cliente.nombre || "",
        cliente.apellido || ""

    ]
        .join(" ")
        .trim() ||
        "Cliente";

}

function calcularPreciosComprobante(
    comprobante
) {

    const subtotal =
        Number(
            comprobante.subtotal ||
            0
        );

    const descuento =
        Number(
            comprobante.descuento ||
            0
        );

    const delivery =
        Number(
            comprobante.delivery ||
            0
        );

    const total =
        Number(

            comprobante.total ??

            Math.max(
                0,
                subtotal -
                descuento +
                delivery
            )

        );

    const operacionGravada =
        total / 1.18;

    const igv =
        total -
        operacionGravada;

    return {

        subtotal,

        descuento,

        delivery,

        total,

        operacionGravada,

        igv

    };

}

function crearFilaProducto(
    producto
) {

    const cantidad =
        Number(
            producto.cantidad ??
            producto.qty ??
            1
        );

    const precio =
        Number(
            producto.precio ??
            producto.price ??
            0
        );

    const nombre =
        producto.nombre ||
        producto.name ||
        "Producto";

    const extra =
        producto.extra &&
        producto.extra !==
            "NINGUNO"

            ? producto.extra

            : "";

    return `

        <div class="comprobante-item">

            <div class="comprobante-item-info">

                <strong>

                    ${cantidad} x
                    ${escaparComprobante(
                        nombre
                    )}

                </strong>

                ${
                    extra
                        ? `

                            <small>

                                Extra:
                                ${escaparComprobante(
                                    extra
                                )}

                            </small>

                        `
                        : ""
                }

            </div>

            <span class="comprobante-item-precio">

                ${comprobanteDinero(
                    precio *
                    cantidad
                )}

            </span>

        </div>

    `;

}

function renderizarComprobante() {

    const contenedor =
        document.getElementById(
            "comprobante-contenedor"
        );

    const acciones =
        document.getElementById(
            "comprobante-acciones"
        );

    if (!comprobanteActual) {

        acciones.hidden = true;

        contenedor.innerHTML = `

            <div class="comprobante-vacio">

                <span>
                    <i class="fa-solid fa-receipt"></i>
                </span>

                <h2>
                    No encontramos un comprobante reciente
                </h2>

                <p>
                    Esta página muestra el comprobante
                    generado después de completar un pedido.
                    Si ya cerraste la sesión o la pestaña,
                    puedes consultar el pedido desde
                    Mis Pedidos.
                </p>

                <a
                    href="/paginas/pedidos/mis-pedidos/"
                >
                    Ver mis pedidos
                </a>

            </div>

        `;

        return;

    }

    const tipoDocumento =
        obtenerTipoDocumento(
            comprobanteActual
        );

    const esFactura =
        tipoDocumento ===
        "FACTURA";

    const serie =
        generarSerieComprobante(
            comprobanteActual
        );

    const fecha =
        formatearFechaComprobante(
            comprobanteActual.fecha
        );

    const precios =
        calcularPreciosComprobante(
            comprobanteActual
        );

    const nombreCliente =
        obtenerNombreCliente(
            comprobanteActual
        );

    const tipoEntrega =
        comprobanteActual
            .tipoEntrega ===
            "delivery"

            ? "Delivery"

            : "Recojo en tienda";

    const codigoPedido =
        comprobanteActual
            .pedido
            ?.codigo ||
        comprobanteActual
            .pedido
            ?.id ||
        "-";

    const productos =
        comprobanteActual
            .items
            .map(
                crearFilaProducto
            )
            .join("");

    contenedor.innerHTML = `

        <article
            class="comprobante-documento"
            id="comprobante-documento"
        >

            <!-- MARCA -->

            <header class="comprobante-marca">

                <img
                    src="/imagenes/logo/logo.webp"
                    alt="La Fonda"
                    class="comprobante-logo"
                >

                <h2>
                    LA FONDA
                </h2>

                <p>
                    LA FONDA S.A.C.
                </p>

                <p>
                    LIMA - PERÚ
                </p>

            </header>

            <div class="comprobante-separador"></div>

            <!-- TIPO -->

            <section class="comprobante-tipo">

                <strong>
                    ${tipoDocumento} ELECTRÓNICA
                </strong>

                <span>
                    SERIE:
                    ${escaparComprobante(
                        serie
                    )}
                </span>

            </section>

            <div class="comprobante-separador"></div>

            <!-- DATOS -->

            <section class="comprobante-info">

                <div class="comprobante-info-fila">

                    <strong>
                        FECHA EMISIÓN:
                    </strong>

                    ${escaparComprobante(
                        fecha.fecha
                    )}

                    ${escaparComprobante(
                        fecha.hora
                    )}

                </div>

                <div class="comprobante-info-fila">

                    <strong>
                        PEDIDO:
                    </strong>

                    ${escaparComprobante(
                        codigoPedido
                    )}

                </div>

                <div class="comprobante-info-fila">

                    <strong>
                        CLIENTE:
                    </strong>

                    ${escaparComprobante(
                        nombreCliente
                    )}

                </div>

                ${
                    esFactura
                        ? `

                            <div class="comprobante-info-fila">

                                <strong>
                                    RUC:
                                </strong>

                                ${escaparComprobante(
                                    comprobanteActual
                                        .ruc ||
                                    "-"
                                )}

                            </div>

                        `
                        : ""
                }

                <div class="comprobante-info-fila">

                    <strong>
                        ENTREGA:
                    </strong>

                    ${tipoEntrega}

                </div>

                ${
                    comprobanteActual
                        .tipoEntrega ===
                    "delivery"

                        ? `

                            <div class="comprobante-info-fila">

                                <strong>
                                    DIRECCIÓN:
                                </strong>

                                ${escaparComprobante(
                                    comprobanteActual
                                        .direccion ||
                                    "-"
                                )}

                            </div>

                        `
                        : ""
                }

            </section>

            <div class="comprobante-separador"></div>

            <!-- PRODUCTOS -->

            <section>

                <p class="comprobante-subtitulo">
                    DETALLE DEL PEDIDO:
                </p>

                <div class="comprobante-items">

                    ${productos}

                </div>

            </section>

            <div class="comprobante-separador"></div>

            <!-- TOTALES -->

            <section class="comprobante-totales">

                <div class="comprobante-total-fila">

                    <span>
                        SUBTOTAL:
                    </span>

                    <span>
                        ${comprobanteDinero(
                            precios.subtotal
                        )}
                    </span>

                </div>

                ${
                    precios.descuento > 0
                        ? `

                            <div
                                class="comprobante-total-fila descuento"
                            >

                                <span>
                                    DESCUENTO:
                                </span>

                                <span>

                                    -${comprobanteDinero(
                                        precios.descuento
                                    )}

                                </span>

                            </div>

                        `
                        : ""
                }

                ${
                    precios.delivery > 0
                        ? `

                            <div class="comprobante-total-fila">

                                <span>
                                    DELIVERY:
                                </span>

                                <span>
                                    ${comprobanteDinero(
                                        precios.delivery
                                    )}
                                </span>

                            </div>

                        `
                        : ""
                }

                <div class="comprobante-total-fila">

                    <span>
                        OP. GRAVADA:
                    </span>

                    <span>
                        ${comprobanteDinero(
                            precios.operacionGravada
                        )}
                    </span>

                </div>

                <div class="comprobante-total-fila">

                    <span>
                        I.G.V. (18%):
                    </span>

                    <span>
                        ${comprobanteDinero(
                            precios.igv
                        )}
                    </span>

                </div>

                <div class="comprobante-total-fila total">

                    <span>
                        TOTAL:
                    </span>

                    <span>
                        ${comprobanteDinero(
                            precios.total
                        )}
                    </span>

                </div>

            </section>

            <div class="comprobante-separador"></div>

            <!-- PIE -->

            <footer class="comprobante-pie">

                <strong>
                    ¡Gracias por tu preferencia!
                </strong>

                Representación generada por el
                sistema web de La Fonda.

                <br>

                Comprobante utilizado con fines
                demostrativos del proyecto.

            </footer>

        </article>

    `;

    acciones.hidden = false;

    document.title =
        `${tipoDocumento} ${serie} | La Fonda`;

}

function imprimirComprobante() {

    if (!comprobanteActual) {
        return;
    }

    window.print();

}

function configurarEventosComprobante() {

    const boton =
        document.getElementById(
            "btn-imprimir-comprobante"
        );

    boton.addEventListener(
        "click",
        imprimirComprobante
    );

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        comprobanteActual =
            cargarComprobante();

        configurarEventosComprobante();

        renderizarComprobante();

    }
);