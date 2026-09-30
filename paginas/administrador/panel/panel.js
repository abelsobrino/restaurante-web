const panelState = {

    periodo:
        "DIA"

};

async function cargarEstadisticas() {

    const Admin =
        window.LaFondaAdmin;

    if (!Admin) {

        return;

    }

    try {

        Admin.setStatus(
            "Cargando estadísticas..."
        );

        const datos =
            await Admin.rpc(
                "web_admin_estadisticas",
                {

                    p_periodo:
                        panelState.periodo

                }
            );

        document.getElementById(
            "stat-ventas"
        ).textContent =
            datos.ventas || 0;

        document.getElementById(
            "stat-total"
        ).textContent =
            Admin.money(
                datos.total
            );

        document.getElementById(
            "stat-ticket"
        ).textContent =
            Admin.money(
                datos.ticket_promedio
            );

        document.getElementById(
            "stat-origen"
        ).textContent =
            `${datos.web || 0} / ${datos.presencial || 0}`;

        renderizarTopPlatos(
            datos.top_platos || []
        );

        renderizarUltimasVentas(
            datos.ultimas_ventas || []
        );

        Admin.setStatus("");

    }

    catch (error) {

        console.error(
            "Error cargando estadísticas:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

function renderizarTopPlatos(
    platos
) {

    const Admin =
        window.LaFondaAdmin;

    const contenedor =
        document.getElementById(
            "top-platos"
        );

    if (!platos.length) {

        contenedor.innerHTML = `

            <div class="empty-admin">

                Sin ventas en este período.

            </div>

        `;

        return;

    }

    contenedor.innerHTML =
        platos
            .map(
                (plato, indice) => `

                    <div class="admin-list-item">

                        <div>

                            <strong>

                                ${indice + 1}.
                                ${Admin.esc(
                                    plato.nombre ||
                                    "Plato"
                                )}

                            </strong>

                            <small>

                                ${Number(
                                    plato.cantidad ||
                                    0
                                )}

                                unidades ·

                                ${Admin.money(
                                    plato.importe
                                )}

                            </small>

                        </div>

                    </div>

                `
            )
            .join("");

}

function renderizarUltimasVentas(
    ventas
) {

    const Admin =
        window.LaFondaAdmin;

    const contenedor =
        document.getElementById(
            "latest-sales"
        );

    if (!ventas.length) {

        contenedor.innerHTML = `

            <div class="empty-admin">

                Sin ventas registradas.

            </div>

        `;

        return;

    }

    contenedor.innerHTML = `

        <table class="admin-table">

            <thead>

                <tr>

                    <th>
                        Fecha
                    </th>

                    <th>
                        Pedido
                    </th>

                    <th>
                        Origen
                    </th>

                    <th>
                        Tipo
                    </th>

                    <th>
                        Total
                    </th>

                </tr>

            </thead>

            <tbody>

                ${ventas
                    .map(
                        venta => `

                            <tr>

                                <td>

                                    ${formatearFechaVenta(
                                        venta.created_at
                                    )}

                                </td>

                                <td>

                                    ${Admin.esc(
                                        venta.codigo ||
                                        "-"
                                    )}

                                </td>

                                <td>

                                    ${Admin.esc(
                                        venta.origen ||
                                        "-"
                                    )}

                                </td>

                                <td>

                                    ${Admin.esc(
                                        venta.tipo ||
                                        "-"
                                    )}

                                </td>

                                <td>

                                    ${Admin.money(
                                        venta.total
                                    )}

                                </td>

                            </tr>

                        `
                    )
                    .join("")}

            </tbody>

        </table>

    `;

}

function formatearFechaVenta(
    valor
) {

    if (!valor) {

        return "-";

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
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}

function configurarPeriodos() {

    document
        .querySelectorAll(
            "[data-period]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    async () => {

                        panelState.periodo =
                            boton.dataset.period;

                        document
                            .querySelectorAll(
                                "[data-period]"
                            )
                            .forEach(
                                elemento => {

                                    elemento.classList.toggle(

                                        "active",

                                        elemento ===
                                        boton

                                    );

                                }
                            );

                        await cargarEstadisticas();

                    }
                );

            }
        );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (
            !window.LaFondaAdmin
                ?.verificarAcceso()
        ) {

            return;

        }

        configurarPeriodos();

        await cargarEstadisticas();

    }
);