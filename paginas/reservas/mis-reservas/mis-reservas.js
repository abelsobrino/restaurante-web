const MIS_RESERVAS_KEY =
    "la_fonda_reservas";

let reservaPendienteCancelar =
    null;

function escaparReserva(valor) {

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

function obtenerUsuarioMisReservas() {

    if (
        window.LaFondaAuth &&
        typeof LaFondaAuth.getSession ===
            "function"
    ) {

        const sesion =
            LaFondaAuth.getSession();

        if (sesion) {

            return sesion;

        }

    }

    try {

        return JSON.parse(

            localStorage.getItem(
                "la_fonda_user"
            ) || "null"

        );

    }

    catch {

        return null;

    }

}

function cargarTodasLasReservas() {

    try {

        const datos =
            localStorage.getItem(
                MIS_RESERVAS_KEY
            );

        const reservas =
            JSON.parse(
                datos || "[]"
            );

        return Array.isArray(reservas)
            ? reservas
            : [];

    }

    catch (error) {

        console.error(
            "Error leyendo reservas:",
            error
        );

        return [];

    }

}

function guardarTodasLasReservas(
    reservas
) {

    localStorage.setItem(
        MIS_RESERVAS_KEY,
        JSON.stringify(reservas)
    );

}

function obtenerReservasUsuario() {

    const usuario =
        obtenerUsuarioMisReservas();

    if (!usuario?.email) {

        return [];

    }

    const email =
        String(usuario.email)
            .trim()
            .toLowerCase();

    return cargarTodasLasReservas()
        .filter(
            reserva =>

                String(
                    reserva.email || ""
                )
                    .trim()
                    .toLowerCase() ===
                email
        );

}

function obtenerFechaReserva(
    reserva
) {

    if (
        !reserva.fecha ||
        !reserva.hora
    ) {

        return null;

    }

    const fecha =
        new Date(
            `${reserva.fecha}T${reserva.hora}:00`
        );

    return Number.isNaN(
        fecha.getTime()
    )
        ? null
        : fecha;

}

function reservaEsPasada(
    reserva
) {

    const fecha =
        obtenerFechaReserva(
            reserva
        );

    if (!fecha) {

        return true;

    }

    return (
        fecha.getTime() <
        Date.now()
    );

}

function formatearFechaReserva(
    fechaTexto
) {

    if (!fechaTexto) {

        return "Fecha no disponible";

    }

    const fecha =
        new Date(
            `${fechaTexto}T12:00:00`
        );

    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return fechaTexto;

    }

    return fecha.toLocaleDateString(
        "es-PE",
        {

            weekday:
                "long",

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric"

        }
    );

}

function crearTarjetaReserva(
    reserva,
    pasada
) {

    const fecha =
        formatearFechaReserva(
            reserva.fecha
        );

    const hora =
        String(
            reserva.hora || ""
        ).slice(
            0,
            5
        );

    const comentario =
        reserva.descripcion &&
        reserva.descripcion !==
            "Sin comentarios"

            ? `

                <div class="reserva-comentario">

                    “${escaparReserva(
                        reserva.descripcion
                    )}”

                </div>

            `

            : "";

    const identificador =
        reserva.id ||
        "";

    return `

        <article
            class="reserva-card ${
                pasada
                    ? "reserva-pasada"
                    : ""
            }"
        >

            <header class="reserva-card-header">

                <div class="reserva-fecha-info">

                    <div class="reserva-fecha-icono">
                        <i class="fa-regular fa-calendar"></i>
                    </div>

                    <div>

                        <strong>
                            ${escaparReserva(
                                fecha
                            )}
                        </strong>

                        <span>
                            <i class="fa-regular fa-clock"></i> ${escaparReserva(
                                hora
                            )}
                        </span>

                    </div>

                </div>

                <span
                    class="reserva-etiqueta ${
                        pasada
                            ? "completada"
                            : "activa"
                    }"
                >
                    ${
                        pasada
                            ? "Completada"
                            : "Activa"
                    }
                </span>

            </header>

            <div class="reserva-card-body">

                <div class="reserva-dato">

                    <span>
                        Titular
                    </span>

                    <strong>
                        ${escaparReserva(
                            reserva.nombre
                        )}
                    </strong>

                </div>

                <div class="reserva-dato">

                    <span>
                        Personas
                    </span>

                    <strong>
                        <i class="fa-solid fa-user-group"></i> ${Number(
                            reserva.sillas || 0
                        )}
                    </strong>

                </div>

                <div class="reserva-dato">

                    <span>
                        Teléfono
                    </span>

                    <strong>
                        ${escaparReserva(
                            reserva.telefono ||
                            "No registrado"
                        )}
                    </strong>

                </div>

                ${comentario}

            </div>

            ${
                !pasada

                    ? `

                        <footer class="reserva-card-footer">

                            <button
                                type="button"
                                class="reserva-cancelar"
                                data-id="${escaparReserva(
                                    identificador
                                )}"
                                data-fecha="${escaparReserva(
                                    reserva.fecha
                                )}"
                                data-hora="${escaparReserva(
                                    reserva.hora
                                )}"
                                data-email="${escaparReserva(
                                    reserva.email
                                )}"
                                data-nombre="${escaparReserva(
                                    reserva.nombre
                                )}"
                            >
                                Cancelar reserva
                            </button>

                        </footer>

                    `

                    : ""
            }

        </article>

    `;

}

function renderizarMisReservas() {

    const estado =
        document.getElementById(
            "reservas-estado"
        );

    const proximasSeccion =
        document.getElementById(
            "reservas-proximas-seccion"
        );

    const historialSeccion =
        document.getElementById(
            "reservas-historial-seccion"
        );

    const proximasContenedor =
        document.getElementById(
            "reservas-proximas"
        );

    const historialContenedor =
        document.getElementById(
            "reservas-historial"
        );

    const usuario =
        obtenerUsuarioMisReservas();

    if (!usuario) {

        proximasSeccion.hidden = true;

        historialSeccion.hidden = true;

        document.getElementById(
            "reservas-resumen"
        ).hidden = true;

        estado.innerHTML = `

            <div class="reservas-vacio">

                <span class="reservas-vacio-icono">
                    <i class="fa-solid fa-lock"></i>
                </span>

                <h2>
                    Inicia sesión
                </h2>

                <p>
                    Necesitas una cuenta para
                    consultar tus reservas.
                </p>

                <div class="reservas-vacio-botones">

                    <a
                        href="/paginas/acceso/iniciar-sesion/"
                        class="reservas-vacio-boton"
                    >
                        Iniciar sesión
                    </a>

                </div>

            </div>

        `;

        return;

    }

    const reservas =
        obtenerReservasUsuario();

    if (!reservas.length) {

        proximasSeccion.hidden = true;

        historialSeccion.hidden = true;

        document.getElementById(
            "reservas-resumen"
        ).hidden = true;

        estado.innerHTML = `

            <div class="reservas-vacio">

                <span class="reservas-vacio-icono">
                    <i class="fa-regular fa-calendar"></i>
                </span>

                <h2>
                    Aún no tienes reservas
                </h2>

                <p>
                    Cuando reserves una mesa
                    aparecerá aquí.
                </p>

                <div class="reservas-vacio-botones">

                    <a
                        href="/paginas/reservas/nueva-reserva/"
                        class="reservas-vacio-boton"
                    >
                        Reservar mesa
                    </a>

                    <a
                        href="/paginas/menu/carta/"
                        class="reservas-vacio-boton secundario"
                    >
                        Ver carta
                    </a>

                </div>

            </div>

        `;

        return;

    }

    estado.innerHTML = "";

    const proximas =
        reservas
            .filter(
                reserva =>
                    !reservaEsPasada(
                        reserva
                    )
            )
            .sort(
                (a, b) =>

                    obtenerFechaReserva(a) -
                    obtenerFechaReserva(b)
            );

    const historial =
        reservas
            .filter(
                reserva =>
                    reservaEsPasada(
                        reserva
                    )
            )
            .sort(
                (a, b) =>

                    obtenerFechaReserva(b) -
                    obtenerFechaReserva(a)
            );

    document.getElementById(
        "reservas-activas-contador"
    ).textContent =
        proximas.length;

    document.getElementById(
        "reservas-historial-contador"
    ).textContent =
        historial.length;

    document.getElementById(
        "reservas-total-contador"
    ).textContent =
        reservas.length;

    document.getElementById(
        "reservas-resumen"
    ).hidden = false;

    proximasSeccion.hidden =
        proximas.length === 0;

    if (proximas.length) {

        proximasContenedor.innerHTML =
            proximas
                .map(
                    reserva =>
                        crearTarjetaReserva(
                            reserva,
                            false
                        )
                )
                .join("");

    }

    historialSeccion.hidden =
        historial.length === 0;

    if (historial.length) {

        historialContenedor.innerHTML =
            historial
                .map(
                    reserva =>
                        crearTarjetaReserva(
                            reserva,
                            true
                        )
                )
                .join("");

    }

    configurarBotonesCancelar();

}

function configurarBotonesCancelar() {

    document
        .querySelectorAll(
            ".reserva-cancelar"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        abrirModalCancelar({
                            id:
                                boton.dataset.id,

                            fecha:
                                boton.dataset.fecha,

                            hora:
                                boton.dataset.hora,

                            email:
                                boton.dataset.email,

                            nombre:
                                boton.dataset.nombre
                        });

                    }
                );

            }
        );

}

function abrirModalCancelar(
    reserva
) {

    reservaPendienteCancelar =
        reserva;

    const modal =
        document.getElementById(
            "modal-cancelar"
        );

    const detalle =
        document.getElementById(
            "modal-reserva-detalle"
        );

    detalle.innerHTML = `

        <strong>
            ${escaparReserva(
                formatearFechaReserva(
                    reserva.fecha
                )
            )}
        </strong>

        <br>

        ${escaparReserva(
            reserva.hora
        )}

    `;

    modal.classList.add(
        "abierto"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

}

function cerrarModalCancelar() {

    reservaPendienteCancelar =
        null;

    const modal =
        document.getElementById(
            "modal-cancelar"
        );

    modal.classList.remove(
        "abierto"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

}

function confirmarCancelacionReserva() {

    if (
        !reservaPendienteCancelar
    ) {

        return;

    }

    const reservas =
        cargarTodasLasReservas();

    let indice = -1;

    if (
        reservaPendienteCancelar.id
    ) {

        indice =
            reservas.findIndex(
                reserva =>

                    String(
                        reserva.id || ""
                    ) ===
                    String(
                        reservaPendienteCancelar
                            .id
                    )
            );

    }

    if (indice === -1) {

        indice =
            reservas.findIndex(
                reserva =>

                    String(
                        reserva.email || ""
                    ).toLowerCase() ===
                    String(
                        reservaPendienteCancelar
                            .email || ""
                    ).toLowerCase()

                    &&

                    reserva.fecha ===
                    reservaPendienteCancelar
                        .fecha

                    &&

                    reserva.hora ===
                    reservaPendienteCancelar
                        .hora

                    &&

                    reserva.nombre ===
                    reservaPendienteCancelar
                        .nombre
            );

    }

    if (indice === -1) {

        cerrarModalCancelar();

        alert(
            "No se pudo encontrar la reserva."
        );

        return;

    }

    reservas.splice(
        indice,
        1
    );

    guardarTodasLasReservas(
        reservas
    );

    cerrarModalCancelar();

    renderizarMisReservas();

}

function configurarModalReserva() {

    document.getElementById(
        "cancelar-no"
    ).addEventListener(
        "click",
        cerrarModalCancelar
    );

    document.getElementById(
        "cancelar-si"
    ).addEventListener(
        "click",
        confirmarCancelacionReserva
    );

    document.getElementById(
        "modal-cancelar"
    ).addEventListener(
        "click",
        evento => {

            if (
                evento.target.id ===
                "modal-cancelar"
            ) {

                cerrarModalCancelar();

            }

        }
    );

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key ===
                "Escape"
            ) {

                cerrarModalCancelar();

            }

        }
    );

}

function escucharCambiosReservas() {

    window.addEventListener(
        "storage",
        evento => {

            if (
                evento.key ===
                    MIS_RESERVAS_KEY ||

                evento.key ===
                    "la_fonda_user"
            ) {

                renderizarMisReservas();

            }

        }
    );

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarModalReserva();

        escucharCambiosReservas();

        renderizarMisReservas();

    }
);