

const galeriaState = {

    publicaciones: [],

    imagenProcesada: null

};

function galeriaEscapar(valor) {

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

function mostrarEstadoGaleria(
    mensaje,
    tipo = ""
) {

    const estado =
        document.getElementById(
            "galeria-estado"
        );

    estado.textContent =
        mensaje;

    estado.className =
        "galeria-estado";

    if (tipo) {

        estado.classList.add(
            tipo
        );

    }

}

async function cargarGaleria() {

    const grid =
        document.getElementById(
            "galeria-grid"
        );

    try {

        const publicaciones =
            await LaFondaDB.rpc(
                "web_galeria_publica",
                {}
            );

        galeriaState.publicaciones =
            Array.isArray(publicaciones)
                ? publicaciones
                : [];

        if (
            galeriaState
                .publicaciones
                .length === 0
        ) {

            grid.innerHTML = `

                <div class="galeria-vacia">

                    Todavía no hay fotografías
                    publicadas.

                    <br>

                    Las fotografías enviadas por
                    nuestros clientes aparecerán
                    aquí después de ser aprobadas.

                </div>

            `;

            return;

        }

        renderizarGaleria();

    }

    catch (error) {

        console.error(
            "Error cargando galería:",
            error
        );

        grid.innerHTML = `

            <div class="galeria-vacia">

                No se pudo cargar la galería.

                <br><br>

                ${galeriaEscapar(
                    error.message
                )}

            </div>

        `;

    }

}

function renderizarGaleria() {

    const grid =
        document.getElementById(
            "galeria-grid"
        );

    grid.innerHTML =
        galeriaState
            .publicaciones
            .map(
                (
                    publicacion,
                    indice
                ) => {

                    const titulo =
                        publicacion.titulo ||
                        "Momento compartido";

                    const autor =
                        publicacion.autor ||
                        "";

                    return `

                        <article
                            class="galeria-item"
                            data-indice="${indice}"
                            tabindex="0"
                        >

                            <img
                                src="${publicacion.imagen}"
                                alt="${galeriaEscapar(
                                    titulo
                                )}"
                                loading="lazy"
                            >

                            <div class="galeria-overlay">

                                <strong>
                                    ${galeriaEscapar(
                                        titulo
                                    )}
                                </strong>

                                ${
                                    autor
                                        ? `

                                            <span>
                                                ${galeriaEscapar(
                                                    autor
                                                )}
                                            </span>

                                        `
                                        : ""
                                }

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

    configurarEventosFotos();

}

function configurarEventosFotos() {

    document
        .querySelectorAll(
            ".galeria-item"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    abrirGaleriaLightbox(
                        Number(
                            item.dataset.indice
                        )
                    );

                }
            );

            item.addEventListener(
                "keydown",
                evento => {

                    if (
                        evento.key ===
                            "Enter" ||
                        evento.key === " "
                    ) {

                        evento.preventDefault();

                        abrirGaleriaLightbox(
                            Number(
                                item.dataset.indice
                            )
                        );

                    }

                }
            );

        });

}

function abrirGaleriaLightbox(
    indice
) {

    const publicacion =
        galeriaState
            .publicaciones[indice];

    if (!publicacion) {
        return;
    }

    const lightbox =
        document.getElementById(
            "galeria-lightbox"
        );

    const imagen =
        document.getElementById(
            "galeria-lightbox-imagen"
        );

    const titulo =
        document.getElementById(
            "galeria-lightbox-titulo"
        );

    const autor =
        document.getElementById(
            "galeria-lightbox-autor"
        );

    imagen.src =
        publicacion.imagen;

    imagen.alt =
        publicacion.titulo ||
        "Fotografía de La Fonda";

    titulo.textContent =
        publicacion.titulo ||
        "Momento compartido";

    autor.textContent =
        publicacion.autor || "";

    lightbox.classList.add(
        "abierto"
    );

    lightbox.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

}

function cerrarGaleriaLightbox() {

    const lightbox =
        document.getElementById(
            "galeria-lightbox"
        );

    lightbox.classList.remove(
        "abierto"
    );

    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

}

function prepararFormularioGaleria() {

    const sesion =
        LaFondaAuth.getSession();

    if (
        sesion?.rol === "CLIENTE"
    ) {

        const nombre = [

            sesion.nombre || "",
            sesion.apellido || ""

        ]
            .join(" ")
            .trim();

        document.getElementById(
            "galeria-nombre"
        ).value =
            nombre;

    }

}

async function seleccionarImagen() {

    const input =
        document.getElementById(
            "galeria-archivo"
        );

    const archivo =
        input.files[0];

    if (!archivo) {

        quitarImagenGaleria();

        return;

    }

    mostrarEstadoGaleria(
        "Preparando imagen..."
    );

    try {

        const imagen =
            await LaFondaImages.compress(
                archivo
            );

        galeriaState.imagenProcesada =
            imagen;

        const preview =
            document.getElementById(
                "galeria-preview"
            );

        preview.src =
            imagen.preview;

        document.getElementById(
            "galeria-preview-contenedor"
        ).hidden =
            false;

        mostrarEstadoGaleria("");

    }

    catch (error) {

        galeriaState.imagenProcesada =
            null;

        input.value = "";

        mostrarEstadoGaleria(
            error.message,
            "error"
        );

    }

}

function quitarImagenGaleria() {

    galeriaState.imagenProcesada =
        null;

    const input =
        document.getElementById(
            "galeria-archivo"
        );

    const preview =
        document.getElementById(
            "galeria-preview"
        );

    input.value = "";

    preview.removeAttribute(
        "src"
    );

    document.getElementById(
        "galeria-preview-contenedor"
    ).hidden =
        true;

    mostrarEstadoGaleria("");

}

async function enviarFotoGaleria(
    evento
) {

    evento.preventDefault();

    const sesion =
        LaFondaAuth.getSession();

    if (
        !sesion ||
        sesion.rol !== "CLIENTE"
    ) {

        mostrarEstadoGaleria(
            "Inicia sesión con una cuenta de cliente para enviar fotografías.",
            "error"
        );

        sessionStorage.setItem(
            "lafonda_return_to",
            window.location.pathname
        );

        setTimeout(
            () => {

                window.location.href =
                    "/paginas/acceso/iniciar-sesion/";

            },
            800
        );

        return;

    }

    const archivo =
        document.getElementById(
            "galeria-archivo"
        ).files[0];

    if (!archivo) {

        mostrarEstadoGaleria(
            "Selecciona una fotografía.",
            "error"
        );

        return;

    }

    const nombre =
        document
            .getElementById(
                "galeria-nombre"
            )
            .value
            .trim();

    const instagram =
        document
            .getElementById(
                "galeria-instagram"
            )
            .value
            .trim();

    if (!nombre) {

        mostrarEstadoGaleria(
            "Ingresa tu nombre.",
            "error"
        );

        return;

    }

    const boton =
        document.getElementById(
            "galeria-enviar"
        );

    boton.disabled = true;

    boton.textContent =
        "Procesando...";

    try {

        let imagen =
            galeriaState
                .imagenProcesada;

        if (!imagen) {

            imagen =
                await LaFondaImages.compress(
                    archivo
                );

        }

        await LaFondaDB.rpc(
            "web_enviar_foto",
            {

                p_email:
                    sesion.email,

                p_password:
                    sesion.password,

                p_nombre:
                    nombre,

                p_instagram:
                    instagram,

                p_imagen_base64:
                    imagen.base64,

                p_mime:
                    imagen.mime

            }
        );

        document
            .getElementById(
                "galeria-formulario"
            )
            .reset();

        galeriaState.imagenProcesada =
            null;

        document.getElementById(
            "galeria-preview-contenedor"
        ).hidden =
            true;

        document.getElementById(
            "galeria-nombre"
        ).value = [

            sesion.nombre || "",
            sesion.apellido || ""

        ]
            .join(" ")
            .trim();

        mostrarEstadoGaleria(
            "Fotografía enviada. Quedará pendiente hasta que el administrador la apruebe.",
            "exito"
        );

    }

    catch (error) {

        console.error(
            "Error enviando fotografía:",
            error
        );

        mostrarEstadoGaleria(
            error.message,
            "error"
        );

    }

    finally {

        boton.disabled = false;

        boton.textContent =
            "Enviar fotografía";

    }

}

function configurarEventosGaleria() {

    document
        .getElementById(
            "galeria-archivo"
        )
        .addEventListener(
            "change",
            seleccionarImagen
        );

    document
        .getElementById(
            "galeria-quitar-imagen"
        )
        .addEventListener(
            "click",
            quitarImagenGaleria
        );

    document
        .getElementById(
            "galeria-formulario"
        )
        .addEventListener(
            "submit",
            enviarFotoGaleria
        );

    document
        .getElementById(
            "galeria-lightbox-cerrar"
        )
        .addEventListener(
            "click",
            cerrarGaleriaLightbox
        );

    document
        .getElementById(
            "galeria-lightbox"
        )
        .addEventListener(
            "click",
            evento => {

                if (
                    evento.target.id ===
                    "galeria-lightbox"
                ) {

                    cerrarGaleriaLightbox();

                }

            }
        );

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Escape"
            ) {

                cerrarGaleriaLightbox();

            }

        }
    );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        prepararFormularioGaleria();

        configurarEventosGaleria();

        await cargarGaleria();

    }
);