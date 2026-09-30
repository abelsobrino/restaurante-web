const resenasState = {

    rating:
        0,

    hoverRating:
        0

};

function resenaEscapar(valor) {

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

function mostrarEstadoResena(
    mensaje,
    tipo = ""
) {

    const estado =
        document.getElementById(
            "review-status"
        );

    if (!estado) {

        return;

    }

    estado.textContent =
        mensaje;

    estado.className =
        "review-status";

    if (tipo) {

        estado.classList.add(
            tipo
        );

    }

}

async function cargarResenasPublicas() {

    const grid =
        document.getElementById(
            "reviews-grid"
        );

    try {

        const filas =
            await LaFondaDB.rpc(
                "web_resenas_publicas",
                {}
            );

        if (
            !Array.isArray(filas) ||
            !filas.length
        ) {

            grid.innerHTML = `

                <div class="reviews-empty">

                    Todavía no hay reseñas
                    publicadas.

                </div>

            `;

            return;

        }

        grid.innerHTML =
            filas
                .map(
                    resena => {

                        const calificacion =
                            Math.max(
                                0,
                                Math.min(
                                    5,
                                    Number(
                                        resena.calificacion ||
                                        0
                                    )
                                )
                            );

                        return `

                            <article class="review-item">

                                <div
                                    class="review-stars"
                                    aria-label="${calificacion} de 5 estrellas"
                                >

                                    ${Array.from({ length: 5 }, (_, indice) =>
                                        indice < calificacion
                                            ? '<i class="fa-solid fa-star"></i>'
                                            : '<i class="fa-regular fa-star"></i>'
                                    ).join("")}

                                </div>

                                <p class="review-text">

                                    “${resenaEscapar(
                                        resena.comentario ||
                                        ""
                                    )}”

                                </p>

                                <div class="review-author">

                                    <strong>

                                        ${resenaEscapar(
                                            resena.autor ||
                                            "Cliente"
                                        )}

                                    </strong>

                                </div>

                            </article>

                        `;

                    }
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Error cargando reseñas:",
            error
        );

        grid.innerHTML = `

            <div class="reviews-empty">

                No se pudieron cargar
                las reseñas.

                <br>

                ${resenaEscapar(
                    error.message
                )}

            </div>

        `;

    }

}

async function cargarPedidosResenables() {

    const select =
        document.getElementById(
            "review-order"
        );

    const sesion =
        LaFondaAuth.getSession();

    if (
        !sesion ||
        String(
            sesion.rol
        ).toUpperCase() !==
        "CLIENTE"
    ) {

        select.innerHTML = `

            <option value="">
                Inicia sesión como cliente
            </option>

        `;

        select.disabled =
            true;

        return;

    }

    select.disabled =
        false;

    try {

        const filas =
            await LaFondaDB.rpc(
                "web_pedidos_resenables",
                {

                    p_email:
                        sesion.email,

                    p_password:
                        sesion.password

                }
            );

        if (
            !Array.isArray(filas) ||
            !filas.length
        ) {

            select.innerHTML = `

                <option value="">

                    No tienes pedidos pagados
                    pendientes de reseña

                </option>

            `;

            return;

        }

        select.innerHTML = `

            <option value="">
                Selecciona un pedido
            </option>

            ${filas
                .map(
                    pedido => {

                        const fecha =
                            pedido.fecha

                                ? new Date(
                                    pedido.fecha
                                ).toLocaleDateString(
                                    "es-PE"
                                )

                                : "";

                        return `

                            <option
                                value="${Number(
                                    pedido.id
                                )}"
                            >

                                ${resenaEscapar(
                                    pedido.codigo
                                )}

                                ·

                                ${resenaEscapar(
                                    fecha
                                )}

                                ·

                                S/ ${Number(
                                    pedido.total ||
                                    0
                                ).toFixed(2)}

                            </option>

                        `;

                    }
                )
                .join("")}

        `;

    }

    catch (error) {

        console.error(
            "Error cargando pedidos reseñables:",
            error
        );

        select.innerHTML = `

            <option value="">

                ${resenaEscapar(
                    error.message
                )}

            </option>

        `;

    }

}

function obtenerTextoCalificacion(
    rating
) {

    const textos = {

        1:
            "Muy mala",

        2:
            "Mala",

        3:
            "Regular",

        4:
            "Muy buena",

        5:
            "Excelente"

    };

    return textos[rating] ||
        "Selecciona una calificación";

}

function actualizarEstrellas() {

    const estrellas =
        document.querySelectorAll(
            ".rating-star"
        );

    const valorVisual =
        resenasState.hoverRating ||
        resenasState.rating;

    estrellas.forEach(
        estrella => {

            const valor =
                Number(
                    estrella.dataset.rating
                );

            estrella.classList.toggle(
                "hovered",
                Boolean(
                    resenasState.hoverRating &&
                    valor <=
                    resenasState.hoverRating
                )
            );

            estrella.classList.toggle(
                "selected",
                Boolean(
                    !resenasState.hoverRating &&
                    valor <=
                    resenasState.rating
                )
            );

            estrella.setAttribute(
                "aria-checked",

                valor ===
                resenasState.rating

                    ? "true"

                    : "false"
            );

        }
    );

    const etiqueta =
        document.getElementById(
            "rating-label"
        );

    if (etiqueta) {

        etiqueta.textContent =
            obtenerTextoCalificacion(
                valorVisual
            );

    }

}

function seleccionarCalificacion(
    rating
) {

    const valor =
        Number(
            rating
        );

    if (
        valor < 1 ||
        valor > 5
    ) {

        return;

    }

    resenasState.rating =
        valor;

    document.getElementById(
        "review-rating"
    ).value =
        String(valor);

    actualizarEstrellas();

}

function reiniciarCalificacion() {

    resenasState.rating =
        0;

    resenasState.hoverRating =
        0;

    const input =
        document.getElementById(
            "review-rating"
        );

    if (input) {

        input.value =
            "0";

    }

    actualizarEstrellas();

}

function configurarEstrellas() {

    const contenedor =
        document.getElementById(
            "rating-stars"
        );

    const estrellas =
        contenedor.querySelectorAll(
            ".rating-star"
        );

    estrellas.forEach(
        estrella => {

            estrella.addEventListener(
                "click",
                () => {

                    seleccionarCalificacion(
                        estrella.dataset.rating
                    );

                }
            );

            estrella.addEventListener(
                "mouseenter",
                () => {

                    resenasState.hoverRating =
                        Number(
                            estrella.dataset.rating
                        );

                    actualizarEstrellas();

                }
            );

            estrella.addEventListener(
                "keydown",
                evento => {

                    if (
                        evento.key ===
                        "ArrowRight" ||
                        evento.key ===
                        "ArrowUp"
                    ) {

                        evento.preventDefault();

                        seleccionarCalificacion(

                            Math.min(
                                5,

                                (
                                    resenasState.rating ||
                                    0
                                ) + 1
                            )

                        );

                    }

                    if (
                        evento.key ===
                        "ArrowLeft" ||
                        evento.key ===
                        "ArrowDown"
                    ) {

                        evento.preventDefault();

                        seleccionarCalificacion(

                            Math.max(
                                1,

                                (
                                    resenasState.rating ||
                                    1
                                ) - 1
                            )

                        );

                    }

                }
            );

        }
    );

    contenedor.addEventListener(
        "mouseleave",
        () => {

            resenasState.hoverRating =
                0;

            actualizarEstrellas();

        }
    );

    actualizarEstrellas();

}

async function enviarResena(
    evento
) {

    evento.preventDefault();

    const sesion =
        LaFondaAuth.getSession();

    mostrarEstadoResena(
        ""
    );

    if (
        !sesion ||
        String(
            sesion.rol
        ).toUpperCase() !==
        "CLIENTE"
    ) {

        mostrarEstadoResena(
            "Inicia sesión con una cuenta de cliente.",
            "error"
        );

        return;

    }

    const pedidoId =
        Number(
            document.getElementById(
                "review-order"
            ).value
        );

    if (!pedidoId) {

        mostrarEstadoResena(
            "Selecciona un pedido.",
            "error"
        );

        return;

    }

    const calificacion =
        Number(
            document.getElementById(
                "review-rating"
            ).value
        );

    if (
        calificacion < 1 ||
        calificacion > 5
    ) {

        mostrarEstadoResena(
            "Selecciona una calificación de 1 a 5 estrellas.",
            "error"
        );

        return;

    }

    const comentario =
        document
            .getElementById(
                "review-text"
            )
            .value
            .trim();

    if (!comentario) {

        mostrarEstadoResena(
            "Escribe un comentario.",
            "error"
        );

        return;

    }

    const boton =
        document.getElementById(
            "review-submit"
        );

    boton.disabled =
        true;

    boton.textContent =
        "Enviando...";

    try {

        await LaFondaDB.rpc(
            "web_crear_resena",
            {

                p_email:
                    sesion.email,

                p_password:
                    sesion.password,

                p_pedido_id:
                    pedidoId,

                p_calificacion:
                    calificacion,

                p_comentario:
                    comentario

            }
        );

        evento.target.reset();

        reiniciarCalificacion();

        mostrarEstadoResena(
            "Reseña enviada. El administrador decidirá cuándo publicarla.",
            "success"
        );

        await cargarPedidosResenables();

    }

    catch (error) {

        console.error(
            "Error enviando reseña:",
            error
        );

        mostrarEstadoResena(
            error.message,
            "error"
        );

    }

    finally {

        boton.disabled =
            false;

        boton.textContent =
            "Enviar reseña";

    }

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarEstrellas();

        document
            .getElementById(
                "review-form"
            )
            .addEventListener(
                "submit",
                enviarResena
            );

        await Promise.all([

            cargarResenasPublicas(),

            cargarPedidosResenables()

        ]);

    }
);