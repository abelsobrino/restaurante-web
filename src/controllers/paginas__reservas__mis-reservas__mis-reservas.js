// Controlador original adaptado al ciclo de vida de cada ruta React.
export function setup(scope) {
    const { document, window, setInterval } = scope;
    const { LaFondaAuth, LaFondaDB } = window;


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
    return window.LaFondaAuth?.getSession?.() || null;
}

async function obtenerReservasUsuario() {
    const cred = LaFondaAuth.credentials("CLIENTE");
    const datos = await LaFondaDB.rpc("lf_mis_reservas", {p_email:cred.email,p_password:cred.password});
    if (!Array.isArray(datos)) throw new Error("Respuesta de reservas inválida");
    return datos;
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
            `${reserva.fecha}T${reserva.hora}:00-05:00`
        );

    return Number.isNaN(
        fecha.getTime()
    )
        ? null
        : fecha;

}

function reservaEsPasada(reserva) {
    return ["FINALIZADA", "CANCELADA", "NO_ASISTIO"].includes(reserva.estado);
}
function estadoVisible(reserva) {
    return ({PENDIENTE:"Pendiente de mesa", ASIGNADA:"Confirmada", EN_ATENCION:"En atención", FINALIZADA:"Finalizada", CANCELADA:"Cancelada", NO_ASISTIO:"No asistió"})[reserva.estado] || "Pendiente";
}
function puedeCancelar(reserva) {
    return ["PENDIENTE","ASIGNADA"].includes(reserva.estado) && obtenerFechaReserva(reserva)?.getTime() > Date.now();
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
                        escaparReserva(estadoVisible(reserva))
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

                ${reserva.mesa_numero != null ? `<div class="reserva-dato"><span>Mesa asignada</span><strong>${escaparReserva(reserva.mesa_numero)}</strong></div>` : ""}
                ${comentario}

            </div>

            ${
                puedeCancelar(reserva)

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

let consultaActual = 0;
async function renderizarMisReservas() {
    const consulta = ++consultaActual;

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

    if (!proximasContenedor.innerHTML && !historialContenedor.innerHTML) estado.textContent = "Consultando reservas en Supabase…";
    let reservas;
    try { reservas = await obtenerReservasUsuario(); }
    catch (error) {
        if (consulta !== consultaActual || scope.active === false) return;
        proximasSeccion.hidden = historialSeccion.hidden = true;
        document.getElementById("reservas-resumen").hidden = true;
        estado.textContent = /lf_mis_reservas|schema cache/i.test(String(error?.message)) ? "El módulo de reservas no está habilitado en Supabase." : "No se pudieron consultar las reservas en Supabase. Verifica tu sesión y conexión.";
        return;
    }
    if (consulta !== consultaActual || scope.active === false) return;

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

let cancelando = false;
async function confirmarCancelacionReserva() {
    if (!reservaPendienteCancelar || cancelando) return;
    cancelando = true;
    const boton = document.getElementById("cancelar-si");
    boton.disabled = true;
    try {
        const cred = LaFondaAuth.credentials("CLIENTE");
        const ok = await LaFondaDB.rpc("lf_cancelar_reserva", {p_email:cred.email,p_password:cred.password,p_id:reservaPendienteCancelar.id});
        if (ok !== true) throw new Error("No se pudo cancelar la reserva");
        if (scope.active === false) return;
        cerrarModalCancelar();
        await renderizarMisReservas();
    } catch (error) { if (scope.active !== false) alert("No se pudo confirmar la cancelación. Actualiza Mis reservas y verifica el estado."); }
    finally { cancelando = false; boton.disabled = false; }
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

    window.addEventListener("lafonda-session-change", renderizarMisReservas);
    window.addEventListener(
        "storage",
        evento => {

            if (
                evento.key ===
                    "la_fonda_user"
            ) {

                void renderizarMisReservas();

            }

        }
    );

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarModalReserva();

        escucharCambiosReservas();

        void renderizarMisReservas();
        setInterval(() => { void renderizarMisReservas(); }, 30000);

    }
);
}
