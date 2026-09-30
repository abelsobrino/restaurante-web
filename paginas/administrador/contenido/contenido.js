const contenidoState = {

    galeria: [],

    resenas: [],

    filtroGaleria:
        "TODOS",

    busquedaGaleria:
        "",

    filtroResenas:
        "TODOS",

    busquedaResenas:
        ""

};

function contenidoAdmin() {

    return window.LaFondaAdmin;

}

function escaparAtributo(
    valor
) {

    return contenidoAdmin()
        .esc(
            valor
        );

}

async function cargarContenido() {

    const Admin =
        contenidoAdmin();

    try {

        Admin.setStatus(
            "Cargando contenido..."
        );

        const [
            galeria,
            resenas
        ] =
            await Promise.all([

                Admin.rpc(
                    "web_admin_galeria"
                ),

                Admin.rpc(
                    "web_admin_resenas"
                )

            ]);

        contenidoState.galeria =
            Array.isArray(
                galeria
            )
                ? galeria
                : [];

        contenidoState.resenas =
            Array.isArray(
                resenas
            )
                ? resenas
                : [];

        renderizarGaleria();

        renderizarResenas();

        actualizarResumenContenido();

        Admin.setStatus("");

    }

    catch (error) {

        console.error(
            "Error cargando contenido:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

function actualizarResumenContenido() {

    const resumen =
        document.getElementById(
            "contenido-resumen"
        );

    const fotos =
        contenidoState.galeria;

    const resenas =
        contenidoState.resenas;

    const fotosPublicadas =
        fotos.filter(
            foto =>
                normalizarEstado(
                    foto.estado
                ) ===
                "PUBLICADA"
        ).length;

    const resenasPublicadas =
        resenas.filter(
            resena =>
                normalizarEstado(
                    resena.estado
                ) ===
                "PUBLICADA"
        ).length;

    document.getElementById(
        "contenido-fotos-total"
    ).textContent =
        fotos.length;

    document.getElementById(
        "contenido-fotos-publicadas"
    ).textContent =
        fotosPublicadas;

    document.getElementById(
        "contenido-resenas-total"
    ).textContent =
        resenas.length;

    document.getElementById(
        "contenido-resenas-publicadas"
    ).textContent =
        resenasPublicadas;

    document.getElementById(
        "badge-galeria"
    ).textContent =
        fotos.length;

    document.getElementById(
        "badge-resenas"
    ).textContent =
        resenas.length;

    resumen.hidden =
        false;

}

function normalizarEstado(
    estado
) {

    return String(
        estado ||
        "PENDIENTE"
    )
        .trim()
        .toUpperCase();

}

function configurarSubnavContenido() {

    document
        .querySelectorAll(
            "[data-contenido-section]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        const seccion =
                            boton.dataset
                                .contenidoSection;

                        document
                            .querySelectorAll(
                                "[data-contenido-section]"
                            )
                            .forEach(
                                elemento => {

                                    elemento.classList.toggle(

                                        "active",

                                        elemento === boton

                                    );

                                }
                            );

                        document
                            .querySelectorAll(
                                ".contenido-section"
                            )
                            .forEach(
                                elemento => {

                                    elemento.classList.toggle(

                                        "active",

                                        elemento.id ===
                                            `contenido-section-${seccion}`

                                    );

                                }
                            );

                    }
                );

            }
        );

}

function obtenerGaleriaFiltrada() {

    const busqueda =
        contenidoState
            .busquedaGaleria
            .trim()
            .toLowerCase();

    return contenidoState
        .galeria
        .filter(
            foto => {

                const estado =
                    normalizarEstado(
                        foto.estado
                    );

                if (
                    contenidoState
                        .filtroGaleria !==
                    "TODOS"
                ) {

                    if (
                        contenidoState
                            .filtroGaleria ===
                            "PENDIENTE"
                    ) {

                        if (
                            estado ===
                                "PUBLICADA" ||
                            estado ===
                                "RECHAZADA"
                        ) {

                            return false;

                        }

                    }

                    else if (
                        estado !==
                        contenidoState
                            .filtroGaleria
                    ) {

                        return false;

                    }

                }

                if (!busqueda) {

                    return true;

                }

                return (

                    String(
                        foto.autor ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            busqueda
                        )

                    ||

                    String(
                        foto.titulo ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            busqueda
                        )

                    ||

                    String(
                        foto.instagram ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            busqueda
                        )

                );

            }
        );

}

function claseEstadoFoto(
    estado
) {

    const valor =
        normalizarEstado(
            estado
        );

    if (
        valor === "PUBLICADA"
    ) {

        return "publicada";

    }

    if (
        valor === "RECHAZADA"
    ) {

        return "rechazada";

    }

    return "pendiente";

}

function obtenerInstagramFoto(
    foto
) {

    const instagram =
        String(
            foto.instagram ||
            ""
        ).trim();

    if (!instagram) {

        return "Sin Instagram";

    }

    return instagram.startsWith(
        "@"
    )
        ? instagram
        : `@${instagram}`;

}

function renderizarGaleria() {

    const Admin =
        contenidoAdmin();

    const contenedor =
        document.getElementById(
            "gallery-admin"
        );

    const fotos =
        obtenerGaleriaFiltrada();

    if (!fotos.length) {

        contenedor.innerHTML = `

            <div class="empty-admin">

                No se encontraron fotografías.

            </div>

        `;

        return;

    }

    contenedor.innerHTML =
        fotos
            .map(
                foto => {

                    const estado =
                        normalizarEstado(
                            foto.estado
                        );

                    return `

                        <article class="moderation-card">

                            <div
                                class="moderation-image"
                                data-view-photo="${Number(
                                    foto.id
                                )}"
                            >

                                <img
                                    src="${escaparAtributo(
                                        foto.imagen
                                    )}"
                                    alt="Foto enviada por ${escaparAtributo(
                                        foto.autor ||
                                        "cliente"
                                    )}"
                                >

                                <span
                                    class="moderation-state ${claseEstadoFoto(
                                        estado
                                    )}"
                                >

                                    ${Admin.esc(
                                        estado
                                    )}

                                </span>

                            </div>

                            <div class="moderation-body">

                                <div class="moderation-author">

                                    <div>

                                        <strong>

                                            ${Admin.esc(
                                                foto.autor ||
                                                "Cliente"
                                            )}

                                        </strong>

                                        <small>

                                            ${Admin.esc(
                                                obtenerInstagramFoto(
                                                    foto
                                                )
                                            )}

                                        </small>

                                    </div>

                                </div>

                                <input
                                    class="moderation-title-field"
                                    data-title-photo="${Number(
                                        foto.id
                                    )}"
                                    maxlength="120"
                                    placeholder="Título de la fotografía"
                                    value="${escaparAtributo(
                                        foto.titulo ||
                                        ""
                                    )}"
                                >

                                <div class="moderation-actions">

                                    <button
                                        type="button"
                                        class="approve"
                                        data-photo="${Number(
                                            foto.id
                                        )}"
                                        data-photo-state="PUBLICADA"
                                    >
                                        <i class="fa-solid fa-check"></i> Publicar
                                    </button>

                                    <button
                                        type="button"
                                        class="reject"
                                        data-photo="${Number(
                                            foto.id
                                        )}"
                                        data-photo-state="RECHAZADA"
                                    >
                                        <i class="fa-solid fa-xmark"></i> Rechazar
                                    </button>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

    configurarAccionesGaleria();

}

function configurarAccionesGaleria() {

    document
        .querySelectorAll(
            "[data-photo]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        moderarFoto(
                            boton
                        );

                    }
                );

            }
        );

    document
        .querySelectorAll(
            "[data-view-photo]"
        )
        .forEach(
            elemento => {

                elemento.addEventListener(
                    "click",
                    () => {

                        abrirFoto(
                            Number(
                                elemento.dataset
                                    .viewPhoto
                            )
                        );

                    }
                );

            }
        );

}

async function moderarFoto(
    boton
) {

    const Admin =
        contenidoAdmin();

    const id =
        Number(
            boton.dataset.photo
        );

    const estado =
        boton.dataset
            .photoState;

    const inputTitulo =
        document.querySelector(
            `[data-title-photo="${id}"]`
        );

    const titulo =
        inputTitulo
            ?.value
            .trim() ||
        "";

    boton.disabled =
        true;

    try {

        Admin.setStatus(
            estado === "PUBLICADA"
                ? "Publicando fotografía..."
                : "Rechazando fotografía..."
        );

        await Admin.rpc(
            "web_admin_moderar_foto",
            {

                p_id:
                    id,

                p_estado:
                    estado,

                p_titulo:
                    titulo,

                p_orden:
                    0

            }
        );

        Admin.setStatus(
            estado === "PUBLICADA"
                ? "Fotografía publicada correctamente."
                : "Fotografía rechazada.",
            "success"
        );

        await cargarContenido();

    }

    catch (error) {

        console.error(
            "Error moderando fotografía:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

    finally {

        boton.disabled =
            false;

    }

}

function abrirFoto(id) {

    const foto =
        contenidoState
            .galeria
            .find(
                item =>
                    Number(
                        item.id
                    ) ===
                    Number(id)
            );

    if (!foto) {

        return;

    }

    document.getElementById(
        "photo-modal-image"
    ).src =
        foto.imagen;

    document.getElementById(
        "photo-modal-author"
    ).textContent =
        foto.autor ||
        "Cliente";

    document.getElementById(
        "photo-modal-instagram"
    ).textContent =
        obtenerInstagramFoto(
            foto
        );

    const modal =
        document.getElementById(
            "photo-modal"
        );

    modal.classList.add(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

}

function cerrarFoto() {

    const modal =
        document.getElementById(
            "photo-modal"
        );

    modal.classList.remove(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

}

function configurarModalFoto() {

    document.getElementById(
        "photo-modal-close"
    ).addEventListener(
        "click",
        cerrarFoto
    );

    document.getElementById(
        "photo-modal"
    ).addEventListener(
        "click",
        evento => {

            if (
                evento.target.id ===
                "photo-modal"
            ) {

                cerrarFoto();

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

                cerrarFoto();

            }

        }
    );

}

function obtenerResenasFiltradas() {

    const busqueda =
        contenidoState
            .busquedaResenas
            .trim()
            .toLowerCase();

    return contenidoState
        .resenas
        .filter(
            resena => {

                const estado =
                    normalizarEstado(
                        resena.estado
                    );

                if (
                    contenidoState
                        .filtroResenas !==
                    "TODOS"
                ) {

                    if (
                        contenidoState
                            .filtroResenas ===
                            "PENDIENTE"
                    ) {

                        if (
                            estado ===
                                "PUBLICADA" ||
                            estado ===
                                "OCULTA"
                        ) {

                            return false;

                        }

                    }

                    else if (
                        estado !==
                        contenidoState
                            .filtroResenas
                    ) {

                        return false;

                    }

                }

                if (!busqueda) {

                    return true;

                }

                return (

                    String(
                        resena.autor ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            busqueda
                        )

                    ||

                    String(
                        resena.comentario ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            busqueda
                        )

                );

            }
        );

}

function estrellasResena(
    cantidad
) {

    const valor =
        Math.max(
            0,
            Math.min(
                5,
                Number(
                    cantidad
                ) || 0
            )
        );

    return Array.from(
        { length: 5 },
        (_, indice) =>
            indice < valor
                ? '<i class="fa-solid fa-star"></i>'
                : '<i class="fa-regular fa-star"></i>'
    ).join("");

}

function claseEstadoResena(
    estado
) {

    const valor =
        normalizarEstado(
            estado
        );

    if (
        valor === "PUBLICADA"
    ) {

        return "publicada";

    }

    if (
        valor === "OCULTA"
    ) {

        return "oculta";

    }

    return "pendiente";

}

function renderizarResenas() {

    const Admin =
        contenidoAdmin();

    const contenedor =
        document.getElementById(
            "reviews-admin"
        );

    const resenas =
        obtenerResenasFiltradas();

    if (!resenas.length) {

        contenedor.innerHTML = `

            <div class="empty-admin">

                No se encontraron reseñas.

            </div>

        `;

        return;

    }

    contenedor.innerHTML =
        resenas
            .map(
                resena => {

                    const estado =
                        normalizarEstado(
                            resena.estado
                        );

                    return `

                        <article class="review-admin-card">

                            <div>

                                <div class="review-admin-header">

                                    <span class="review-admin-stars">

                                        ${estrellasResena(
                                            resena.calificacion
                                        )}

                                    </span>

                                    <strong class="review-admin-author">

                                        ${Admin.esc(
                                            resena.autor ||
                                            "Cliente"
                                        )}

                                    </strong>

                                    <span
                                        class="review-admin-status ${claseEstadoResena(
                                            estado
                                        )}"
                                    >

                                        ${Admin.esc(
                                            estado
                                        )}

                                    </span>

                                </div>

                                <p class="review-admin-comment">

                                    “${Admin.esc(
                                        resena.comentario ||
                                        ""
                                    )}”

                                </p>

                            </div>

                            <div class="review-admin-actions">

                                <button
                                    type="button"
                                    class="publish"
                                    data-review="${Number(
                                        resena.id
                                    )}"
                                    data-review-state="PUBLICADA"
                                >
                                    Publicar
                                </button>

                                <button
                                    type="button"
                                    class="hide"
                                    data-review="${Number(
                                        resena.id
                                    )}"
                                    data-review-state="OCULTA"
                                >
                                    Ocultar
                                </button>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

    configurarAccionesResenas();

}

function configurarAccionesResenas() {

    document
        .querySelectorAll(
            "[data-review]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        moderarResena(
                            boton
                        );

                    }
                );

            }
        );

}

async function moderarResena(
    boton
) {

    const Admin =
        contenidoAdmin();

    const id =
        Number(
            boton.dataset.review
        );

    const estado =
        boton.dataset
            .reviewState;

    boton.disabled =
        true;

    try {

        Admin.setStatus(
            estado === "PUBLICADA"
                ? "Publicando reseña..."
                : "Ocultando reseña..."
        );

        await Admin.rpc(
            "web_admin_moderar_resena",
            {

                p_id:
                    id,

                p_estado:
                    estado

            }
        );

        Admin.setStatus(
            estado === "PUBLICADA"
                ? "Reseña publicada correctamente."
                : "Reseña ocultada.",
            "success"
        );

        await cargarContenido();

    }

    catch (error) {

        console.error(
            "Error moderando reseña:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

    finally {

        boton.disabled =
            false;

    }

}

function configurarFiltrosContenido() {

    document.getElementById(
        "gallery-search"
    ).addEventListener(
        "input",
        evento => {

            contenidoState
                .busquedaGaleria =
                evento.target.value;

            renderizarGaleria();

        }
    );

    document.getElementById(
        "gallery-filter"
    ).addEventListener(
        "change",
        evento => {

            contenidoState
                .filtroGaleria =
                evento.target.value;

            renderizarGaleria();

        }
    );

    document.getElementById(
        "review-search"
    ).addEventListener(
        "input",
        evento => {

            contenidoState
                .busquedaResenas =
                evento.target.value;

            renderizarResenas();

        }
    );

    document.getElementById(
        "review-filter"
    ).addEventListener(
        "change",
        evento => {

            contenidoState
                .filtroResenas =
                evento.target.value;

            renderizarResenas();

        }
    );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const Admin =
            contenidoAdmin();

        if (
            !Admin ||
            !Admin.verificarAcceso()
        ) {

            return;

        }

        configurarSubnavContenido();

        configurarFiltrosContenido();

        configurarModalFoto();

        await cargarContenido();

    }
);