const pedidosState = {

    pedidos: [],

    filtro:
        "TODOS"

};

function escaparPedido(valor) {

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

function pedidoDinero(valor) {

    return `S/ ${Number(
        valor || 0
    ).toFixed(2)}`;

}

function normalizarEstadoPedido(
    estado
) {

    return String(
        estado || "PENDIENTE"
    )
        .trim()
        .toUpperCase();

}

function claseEstadoPedido(
    estado
) {

    const valor =
        normalizarEstadoPedido(
            estado
        );

    if (
        valor.includes(
            "COMPLET"
        ) ||
        valor.includes(
            "ENTREG"
        ) ||
        valor.includes(
            "PAGADO"
        )
    ) {

        return "completado";

    }

    if (
        valor.includes(
            "PREPAR"
        )
    ) {

        return "preparando";

    }

    if (
        valor.includes(
            "LISTO"
        )
    ) {

        return "listo";

    }

    if (
        valor.includes(
            "CANCEL"
        )
    ) {

        return "cancelado";

    }

    return "pendiente";

}

function formatearFechaPedido(
    valor
) {

    if (!valor) {

        return "Fecha no disponible";

    }

    const fecha =
        new Date(valor);

    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return valor;

    }

    return fecha.toLocaleString(
        "es-PE",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}

function obtenerSubtotalItem(
    item
) {

    if (
        item.subtotal != null
    ) {

        return Number(
            item.subtotal
        );

    }

    return (
        Number(
            item.precio || 0
        ) *
        Number(
            item.cantidad || 0
        )
    );

}

function crearItemPedido(item) {

    return `

        <div class="pedido-item">

            <span class="item-cantidad">

                ${Number(
                    item.cantidad || 0
                )}×

            </span>

            <span class="item-nombre">

                ${escaparPedido(
                    item.nombre ||
                    "Producto"
                )}

            </span>

            <span class="item-precio">

                ${pedidoDinero(
                    obtenerSubtotalItem(
                        item
                    )
                )}

            </span>

        </div>

    `;

}

function crearTarjetaPedido(
    pedido
) {

    const estado =
        normalizarEstadoPedido(
            pedido.estado
        );

    const claseEstado =
        claseEstadoPedido(
            estado
        );

    const items =
        Array.isArray(
            pedido.items
        )
            ? pedido.items
            : [];

    const direccion =
        pedido.direccion ||
        "Recojo en tienda";

    const tipo =
        pedido.tipo ||
        pedido.tipo_entrega ||
        "Pedido web";

    const descuento =
        Number(
            pedido.descuento || 0
        );

    const delivery =
        Number(
            pedido.delivery ||
            pedido.costo_delivery ||
            0
        );

    return `

        <article class="pedido-card">

            <!-- HEADER -->

            <header class="pedido-header">

                <div class="pedido-identificacion">

                    <span class="pedido-id">

                        ${escaparPedido(
                            pedido.codigo ||
                            `PED-${pedido.id || ""}`
                        )}

                    </span>

                    <span class="pedido-fecha">

                        ${escaparPedido(
                            formatearFechaPedido(
                                pedido.created_at
                            )
                        )}

                    </span>

                </div>

                <span
                    class="pedido-estado ${claseEstado}"
                >

                    ${escaparPedido(
                        estado
                    )}

                </span>

            </header>

            <!-- PRODUCTOS -->

            <div class="pedido-items">

                ${
                    items.length

                        ? items
                            .map(
                                crearItemPedido
                            )
                            .join("")

                        : `

                            <div class="pedido-item">

                                <span class="item-nombre">
                                    Sin detalle de productos
                                </span>

                            </div>

                        `
                }

            </div>

            <!-- DATOS -->

            <div class="pedido-datos">

                <div class="pedido-dato">

                    <span>
                        Tipo de entrega
                    </span>

                    <strong>
                        <i class="fa-solid fa-box"></i> ${escaparPedido(
                            tipo
                        )}
                    </strong>

                </div>

                <div class="pedido-dato">

                    <span>
                        Dirección
                    </span>

                    <strong>
                        <i class="fa-solid fa-location-dot"></i> ${escaparPedido(
                            direccion
                        )}
                    </strong>

                </div>

            </div>

            <!-- FOOTER -->

            <footer class="pedido-footer">

                <div class="pedido-precios">

                    ${
                        descuento > 0

                            ? `

                                <span class="pedido-descuento">

                                    Descuento:
                                    -${pedidoDinero(
                                        descuento
                                    )}

                                </span>

                            `

                            : ""
                    }

                    ${
                        delivery > 0

                            ? `

                                <span>

                                    Delivery:
                                    ${pedidoDinero(
                                        delivery
                                    )}

                                </span>

                            `

                            : ""
                    }

                </div>

                <span class="pedido-total">

                    Total:

                    <strong>

                        ${pedidoDinero(
                            pedido.total
                        )}

                    </strong>

                </span>

            </footer>

        </article>

    `;

}

async function cargarMisPedidos() {

    const contenedor =
        document.getElementById(
            "pedidos-list"
        );

    const sesion =
        LaFondaAuth.getSession();

    if (
        !sesion ||
        sesion.rol !== "CLIENTE"
    ) {

        document.getElementById(
            "pedidos-resumen"
        ).hidden = true;

        document.getElementById(
            "pedidos-filtros"
        ).hidden = true;

        contenedor.innerHTML = `

            <div class="pedidos-vacio">

                <span class="pedidos-vacio-icono">
                    <i class="fa-solid fa-lock"></i>
                </span>

                <h2>
                    Inicia sesión
                </h2>

                <p>
                    Necesitas ingresar con una
                    cuenta de cliente para consultar
                    tus pedidos.
                </p>

                <div class="pedidos-vacio-botones">

                    <a
                        href="/paginas/acceso/iniciar-sesion/"
                        class="pedidos-vacio-boton"
                    >
                        Iniciar sesión
                    </a>

                </div>

            </div>

        `;

        return;

    }

    try {

        const filas =
            await LaFondaDB.rpc(
                "web_mis_pedidos",
                {

                    p_email:
                        sesion.email,

                    p_password:
                        sesion.password

                }
            );

        pedidosState.pedidos =
            Array.isArray(filas)
                ? filas
                : [];

        actualizarResumenPedidos();

        renderizarPedidos();

    }

    catch (error) {

        console.error(
            "Error cargando pedidos:",
            error
        );

        contenedor.innerHTML = `

            <div class="pedidos-vacio">

                <span class="pedidos-vacio-icono">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </span>

                <h2>
                    No pudimos cargar tus pedidos
                </h2>

                <p>
                    ${escaparPedido(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}

function actualizarResumenPedidos() {

    const pedidos =
        pedidosState.pedidos;

    if (!pedidos.length) {

        document.getElementById(
            "pedidos-resumen"
        ).hidden = true;

        document.getElementById(
            "pedidos-filtros"
        ).hidden = true;

        return;

    }

    const completados =
        pedidos.filter(
            pedido =>
                claseEstadoPedido(
                    pedido.estado
                ) === "completado"
        );

    const gastado =
        completados.reduce(
            (total, pedido) =>

                total +
                Number(
                    pedido.total || 0
                ),

            0
        );

    document.getElementById(
        "pedidos-total"
    ).textContent =
        pedidos.length;

    document.getElementById(
        "pedidos-completados"
    ).textContent =
        completados.length;

    document.getElementById(
        "pedidos-gastado"
    ).textContent =
        pedidoDinero(
            gastado
        );

    document.getElementById(
        "pedidos-resumen"
    ).hidden = false;

    document.getElementById(
        "pedidos-filtros"
    ).hidden = false;

}

function obtenerPedidosFiltrados() {

    if (
        pedidosState.filtro ===
        "TODOS"
    ) {

        return [
            ...pedidosState.pedidos
        ];

    }

    return pedidosState.pedidos
        .filter(
            pedido => {

                const estado =
                    normalizarEstadoPedido(
                        pedido.estado
                    );

                return estado.includes(
                    pedidosState.filtro
                );

            }
        );

}

function renderizarPedidos() {

    const contenedor =
        document.getElementById(
            "pedidos-list"
        );

    if (
        !pedidosState
            .pedidos
            .length
    ) {

        contenedor.innerHTML = `

            <div class="pedidos-vacio">

                <span class="pedidos-vacio-icono">
                    <i class="fa-solid fa-burger"></i>
                </span>

                <h2>
                    Aún no tienes pedidos
                </h2>

                <p>
                    Cuando realices tu primer pedido
                    desde la Carta aparecerá aquí.
                </p>

                <div class="pedidos-vacio-botones">

                    <a
                        href="/paginas/menu/carta/"
                        class="pedidos-vacio-boton"
                    >
                        Ver carta
                    </a>

                </div>

            </div>

        `;

        return;

    }

    const pedidos =
        obtenerPedidosFiltrados();

    if (!pedidos.length) {

        contenedor.innerHTML = `

            <div class="pedidos-vacio">

                <span class="pedidos-vacio-icono">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </span>

                <h2>
                    No encontramos pedidos
                </h2>

                <p>
                    No tienes pedidos con
                    el estado seleccionado.
                </p>

            </div>

        `;

        return;

    }

    pedidos.sort(
        (a, b) =>

            new Date(
                b.created_at || 0
            ) -

            new Date(
                a.created_at || 0
            )
    );

    contenedor.innerHTML = `

        <div class="pedidos-grid">

            ${pedidos
                .map(
                    crearTarjetaPedido
                )
                .join("")}

        </div>

    `;

}

function configurarFiltroPedidos() {

    document.getElementById(
        "pedidos-filtro-estado"
    ).addEventListener(
        "change",
        evento => {

            pedidosState.filtro =
                evento.target.value;

            renderizarPedidos();

        }
    );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarFiltroPedidos();

        await cargarMisPedidos();

    }
);