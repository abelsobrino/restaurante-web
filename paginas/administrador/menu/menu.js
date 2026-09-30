const menuAdminState = {

    platos: [],

    categorias: [],

    filtroPlato:
        "all",

    combos: [],

    comboItems: []

};

function obtenerAdmin() {

    return window.LaFondaAdmin;

}

function configurarSubnavMenu() {

    document
        .querySelectorAll(
            "[data-menu-section]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        const seccion =
                            boton.dataset
                                .menuSection;

                        document
                            .querySelectorAll(
                                "[data-menu-section]"
                            )
                            .forEach(
                                elemento => {

                                    elemento
                                        .classList
                                        .toggle(
                                            "active",
                                            elemento === boton
                                        );

                                }
                            );

                        document
                            .querySelectorAll(
                                ".menu-section"
                            )
                            .forEach(
                                elemento => {

                                    elemento
                                        .classList
                                        .toggle(
                                            "active",
                                            elemento.id ===
                                                `menu-section-${seccion}`
                                        );

                                }
                            );

                    }
                );

            }
        );

}

async function cargarPlatos() {

    const Admin =
        obtenerAdmin();

    try {

        Admin.setStatus(
            "Cargando platos..."
        );

        const datos =
            await Admin.rpc(
                "web_admin_platos"
            );

        menuAdminState.platos =
            datos?.platos || [];

        menuAdminState.categorias =
            datos?.categorias || [];

        renderizarCategorias();

        renderizarPlatos();

        renderizarPlatosCombo();

        Admin.setStatus("");

    }

    catch (error) {

        console.error(
            "Error cargando platos:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

function renderizarCategorias() {

    const Admin =
        obtenerAdmin();

    const select =
        document.getElementById(
            "dish-category"
        );

    select.innerHTML =
        menuAdminState
            .categorias
            .map(
                categoria => `

                    <option
                        value="${Number(
                            categoria.id
                        )}"
                    >

                        ${Admin.esc(
                            categoria.nombre
                        )}

                    </option>

                `
            )
            .join("");

}

function platoCoincideFiltro(
    plato
) {

    switch (
        menuAdminState
            .filtroPlato
    ) {

        case "pending":

            return !plato.tiene_imagen;

        case "published":

            return (
                plato.tiene_imagen &&
                plato.disponible
            );

        case "off":

            return !plato.disponible;

        default:

            return true;

    }

}

function renderizarPlatos() {

    const Admin =
        obtenerAdmin();

    const contenedor =
        document.getElementById(
            "admin-dishes"
        );

    const platos =
        menuAdminState
            .platos
            .filter(
                platoCoincideFiltro
            );

    if (!platos.length) {

        contenedor.innerHTML = `

            <div class="empty-admin">

                No hay platos con
                este filtro.

            </div>

        `;

        return;

    }

    contenedor.innerHTML =
        platos
            .map(
                plato => {

                    const imagen =
                        plato.imagen

                            ? `

                                <img
                                    src="${Admin.esc(
                                        plato.imagen
                                    )}"
                                    alt="${Admin.esc(
                                        plato.nombre
                                    )}"
                                >

                            `

                            : `

                                <div
                                    class="dish-admin-placeholder"
                                >
                                    PENDIENTE DE IMAGEN
                                </div>

                            `;

                    let estadoClase =
                        "pending";

                    let estadoTexto =
                        "SIN IMAGEN";

                    if (
                        !plato.disponible
                    ) {

                        estadoClase =
                            "off";

                        estadoTexto =
                            "NO DISPONIBLE";

                    }

                    else if (
                        plato.tiene_imagen
                    ) {

                        estadoClase =
                            "ok";

                        estadoTexto =
                            "PUBLICADO";

                    }

                    return `

                        <article
                            class="dish-admin-card"
                            data-dish-id="${Number(
                                plato.id
                            )}"
                        >

                            ${imagen}

                            <div class="dish-admin-body">

                                <strong>

                                    ${Admin.esc(
                                        plato.nombre
                                    )}

                                </strong>

                                <small>

                                    ${Admin.esc(
                                        plato.categoria ||
                                        "Sin categoría"
                                    )}

                                    ·

                                    ${Admin.money(
                                        plato.precio
                                    )}

                                </small>

                                <span
                                    class="status-pill ${estadoClase}"
                                >
                                    ${estadoTexto}
                                </span>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

    contenedor
        .querySelectorAll(
            "[data-dish-id]"
        )
        .forEach(
            tarjeta => {

                tarjeta.addEventListener(
                    "click",
                    () => {

                        editarPlato(
                            Number(
                                tarjeta
                                    .dataset
                                    .dishId
                            )
                        );

                    }
                );

            }
        );

}

function editarPlato(id) {

    const plato =
        menuAdminState
            .platos
            .find(
                item =>
                    Number(
                        item.id
                    ) === id
            );

    if (!plato) {

        return;

    }

    document.getElementById(
        "dish-id"
    ).value =
        plato.id;

    document.getElementById(
        "dish-name"
    ).value =
        plato.nombre || "";

    document.getElementById(
        "dish-description"
    ).value =
        plato.descripcion || "";

    document.getElementById(
        "dish-price"
    ).value =
        plato.precio ?? "";

    document.getElementById(
        "dish-time"
    ).value =
        plato.tiempo_preparacion ??
        "";

    document.getElementById(
        "dish-category"
    ).value =
        plato.categoria_id;

    document.getElementById(
        "dish-available"
    ).checked =
        Boolean(
            plato.disponible
        );

    const preview =
        document.getElementById(
            "dish-preview"
        );

    preview.hidden =
        !plato.imagen;

    if (plato.imagen) {

        preview.src =
            plato.imagen;

    }

    document.getElementById(
        "dish-image"
    ).value =
        "";

    document.getElementById(
        "dish-form-title"
    ).textContent =
        `Editar: ${plato.nombre}`;

    document.getElementById(
        "dish-form"
    ).scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}

function limpiarPlato() {

    document.getElementById(
        "dish-form"
    ).reset();

    document.getElementById(
        "dish-id"
    ).value =
        "";

    document.getElementById(
        "dish-available"
    ).checked =
        true;

    document.getElementById(
        "dish-preview"
    ).hidden =
        true;

    document.getElementById(
        "dish-preview"
    ).removeAttribute(
        "src"
    );

    document.getElementById(
        "dish-form-title"
    ).textContent =
        "Nuevo plato";

}

async function guardarPlato(
    evento
) {

    evento.preventDefault();

    const Admin =
        obtenerAdmin();

    try {

        Admin.setStatus(
            "Guardando plato..."
        );

        const archivo =
            document
                .getElementById(
                    "dish-image"
                )
                .files[0];

        let imagen = null;

        if (archivo) {

            imagen =
                await LaFondaImages
                    .compress(
                        archivo
                    );

        }

        const idPlato =
            Admin.numeroONull(
                "dish-id"
            );

        const parametrosBase = {

            p_id:
                idPlato,

            p_nombre:
                Admin.val(
                    "dish-name"
                ),

            p_descripcion:
                Admin.val(
                    "dish-description"
                ),

            p_precio:
                Number(
                    Admin.val(
                        "dish-price"
                    )
                ),

            p_categoria_id:
                Number(
                    Admin.val(
                        "dish-category"
                    )
                ),

            p_tiempo:
                Admin.numeroONull(
                    "dish-time"
                ),

            p_disponible:
                document
                    .getElementById(
                        "dish-available"
                    )
                    .checked,

            p_imagen_base64:
                imagen?.base64 ||
                null,

            p_imagen_mime:
                imagen?.mime ||
                null

        };

        try {

            await Admin.rpc(
                "web_admin_guardar_plato",
                parametrosBase
            );

        } catch (errorFirma) {

            const mensajeFirma =
                String(
                    errorFirma?.message ||
                    ""
                ).toLowerCase();

            const requiereFirmaStock =
                /p_gestiona_stock|p_stock|schema cache|could not find the function|no function matches|web_admin_guardar_plato/.test(
                    mensajeFirma
                );

            if (!requiereFirmaStock) {
                throw errorFirma;
            }

            const original =
                menuAdminState.platos.find(
                    item =>
                        Number(item.id) ===
                        Number(idPlato)
                );

            const teniaStockLegacy =
                Boolean(original) &&
                original.stock !== null &&
                original.stock !== undefined;

            await Admin.rpc(
                "web_admin_guardar_plato",
                {
                    ...parametrosBase,
                    p_gestiona_stock:
                        teniaStockLegacy,
                    p_stock:
                        teniaStockLegacy
                            ? Number(original.stock)
                            : null
                }
            );

        }

        Admin.setStatus(
            "Plato guardado correctamente.",
            "success"
        );

        limpiarPlato();

        await cargarPlatos();

    }

    catch (error) {

        console.error(
            "Error guardando plato:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

async function previsualizarPlato(
    evento
) {

    const Admin =
        obtenerAdmin();

    const archivo =
        evento.target
            .files[0];

    if (!archivo) {

        return;

    }

    try {

        const imagen =
            await LaFondaImages
                .compress(
                    archivo
                );

        const preview =
            document.getElementById(
                "dish-preview"
            );

        preview.src =
            imagen.preview;

        preview.hidden =
            false;

    }

    catch (error) {

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

function configurarPlatos() {

    document
        .querySelectorAll(
            "[data-dish-filter]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        menuAdminState
                            .filtroPlato =
                            boton.dataset
                                .dishFilter;

                        document
                            .querySelectorAll(
                                "[data-dish-filter]"
                            )
                            .forEach(
                                elemento => {

                                    elemento
                                        .classList
                                        .toggle(
                                            "active",
                                            elemento === boton
                                        );

                                }
                            );

                        renderizarPlatos();

                    }
                );

            }
        );

    document.getElementById(
        "dish-new"
    ).addEventListener(
        "click",
        limpiarPlato
    );

    document.getElementById(
        "dish-clear"
    ).addEventListener(
        "click",
        limpiarPlato
    );

    document.getElementById(
        "dish-form"
    ).addEventListener(
        "submit",
        guardarPlato
    );

    document.getElementById(
        "dish-image"
    ).addEventListener(
        "change",
        previsualizarPlato
    );

}

function renderizarPlatosCombo() {

    const Admin =
        obtenerAdmin();

    const busqueda =
        String(
            document.getElementById(
                "combo-search"
            )?.value || ""
        )
            .trim()
            .toLowerCase();

    const platos =
        menuAdminState
            .platos
            .filter(
                plato =>

                    `${plato.nombre} ${plato.categoria}`
                        .toLowerCase()
                        .includes(
                            busqueda
                        )
            );

    const contenedor =
        document.getElementById(
            "combo-source"
        );

    if (!platos.length) {

        contenedor.innerHTML = `

            <div class="empty-admin">
                No se encontraron platos.
            </div>

        `;

        return;

    }

    contenedor.innerHTML =
        platos
            .map(
                plato => `

                    <div
                        class="combo-source-item"
                        draggable="true"
                        data-combo-source="${Number(
                            plato.id
                        )}"
                    >

                        <strong>

                            ${Admin.esc(
                                plato.nombre
                            )}

                        </strong>

                        <small>

                            ${Admin.esc(
                                plato.categoria ||
                                ""
                            )}

                            ·

                            ${Admin.money(
                                plato.precio
                            )}

                        </small>

                    </div>

                `
            )
            .join("");

    contenedor
        .querySelectorAll(
            "[data-combo-source]"
        )
        .forEach(
            elemento => {

                elemento.addEventListener(
                    "dragstart",
                    evento => {

                        evento
                            .dataTransfer
                            .setData(
                                "text/plain",
                                elemento
                                    .dataset
                                    .comboSource
                            );

                    }
                );

                elemento.addEventListener(
                    "dblclick",
                    () => {

                        agregarItemCombo(
                            Number(
                                elemento
                                    .dataset
                                    .comboSource
                            )
                        );

                    }
                );

            }
        );

}

function agregarItemCombo(
    id,
    cantidad = 1
) {

    const plato =
        menuAdminState
            .platos
            .find(
                item =>
                    Number(
                        item.id
                    ) ===
                    Number(id)
            );

    if (!plato) {

        return;

    }

    const existente =
        menuAdminState
            .comboItems
            .find(
                item =>
                    item.plato_id ===
                    Number(id)
            );

    if (existente) {

        existente.cantidad +=
            cantidad;

    }

    else {

        menuAdminState
            .comboItems
            .push({

                plato_id:
                    Number(id),

                cantidad:
                    cantidad,

                nombre:
                    plato.nombre,

                precio:
                    Number(
                        plato.precio
                    )

            });

    }

    renderizarItemsCombo();

}

function renderizarItemsCombo() {

    const Admin =
        obtenerAdmin();

    const contenedor =
        document.getElementById(
            "combo-selected"
        );

    contenedor.innerHTML =
        menuAdminState
            .comboItems
            .map(
                (item, indice) => `

                    <div class="combo-selected-row">

                        <span>

                            ${Admin.esc(
                                item.nombre
                            )}

                        </span>

                        <input
                            type="number"
                            min="1"
                            max="50"
                            value="${Number(
                                item.cantidad
                            )}"
                            data-combo-qty="${indice}"
                        >

                        <button
                            type="button"
                            data-combo-remove="${indice}"
                            aria-label="Eliminar"
                        >
                            ×
                        </button>

                    </div>

                `
            )
            .join("");

    contenedor
        .querySelectorAll(
            "[data-combo-qty]"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    () => {

                        const indice =
                            Number(
                                input
                                    .dataset
                                    .comboQty
                            );

                        menuAdminState
                            .comboItems[
                                indice
                            ]
                            .cantidad =
                            Math.max(
                                1,
                                Number(
                                    input.value
                                ) || 1
                            );

                        renderizarItemsCombo();

                    }
                );

            }
        );

    contenedor
        .querySelectorAll(
            "[data-combo-remove]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        menuAdminState
                            .comboItems
                            .splice(
                                Number(
                                    boton
                                        .dataset
                                        .comboRemove
                                ),
                                1
                            );

                        renderizarItemsCombo();

                    }
                );

            }
        );

    const precioRegular =
        menuAdminState
            .comboItems
            .reduce(

                (total, item) =>

                    total +
                    item.precio *
                    item.cantidad,

                0

            );

    document.getElementById(
        "combo-regular"
    ).value =
        Admin.money(
            precioRegular
        );

}

async function cargarCombos() {

    const Admin =
        obtenerAdmin();

    try {

        menuAdminState.combos =
            await Admin.rpc(
                "web_admin_combos"
            ) || [];

        renderizarCombosGuardados();

    }

    catch (error) {

        console.error(
            "Error cargando combos:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

function renderizarCombosGuardados() {

    const Admin =
        obtenerAdmin();

    const contenedor =
        document.getElementById(
            "combo-existing"
        );

    if (
        !menuAdminState
            .combos
            .length
    ) {

        contenedor.innerHTML = `

            <div class="empty-admin">
                Todavía no hay combos.
            </div>

        `;

        return;

    }

    contenedor.innerHTML =
        menuAdminState
            .combos
            .map(
                combo => `

                    <div class="admin-list-item">

                        <div>

                            <strong>

                                ${Admin.esc(
                                    combo.nombre
                                )}

                            </strong>

                            <small>

                                ${Admin.money(
                                    combo.precio
                                )}

                                ·

                                ${
                                    combo.tiene_imagen
                                        ? "con imagen"
                                        : "sin imagen"
                                }

                                ·

                                ${
                                    combo.activo
                                        ? "activo"
                                        : "inactivo"
                                }

                            </small>

                        </div>

                        <button
                            type="button"
                            data-edit-combo="${Number(
                                combo.id
                            )}"
                        >
                            Editar
                        </button>

                    </div>

                `
            )
            .join("");

    contenedor
        .querySelectorAll(
            "[data-edit-combo]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        editarCombo(
                            Number(
                                boton
                                    .dataset
                                    .editCombo
                            )
                        );

                    }
                );

            }
        );

}

function editarCombo(id) {

    const combo =
        menuAdminState
            .combos
            .find(
                item =>
                    Number(
                        item.id
                    ) === id
            );

    if (!combo) {

        return;

    }

    document.getElementById(
        "combo-id"
    ).value =
        combo.id;

    document.getElementById(
        "combo-name"
    ).value =
        combo.nombre || "";

    document.getElementById(
        "combo-description"
    ).value =
        combo.descripcion || "";

    document.getElementById(
        "combo-price"
    ).value =
        combo.precio ?? "";

    document.getElementById(
        "combo-active"
    ).checked =
        Boolean(
            combo.activo
        );

    document.getElementById(
        "combo-image"
    ).value =
        "";

    menuAdminState.comboItems =
        (combo.items || [])
            .map(
                item => ({

                    plato_id:
                        Number(
                            item.plato_id
                        ),

                    cantidad:
                        Number(
                            item.cantidad
                        ),

                    nombre:
                        item.nombre,

                    precio:
                        Number(
                            item.precio
                        )

                })
            );

    renderizarItemsCombo();

    const programacion =
        combo.programacion ||
        {};

    document.getElementById(
        "combo-date-start"
    ).value =
        programacion.fecha_inicio ||
        "";

    document.getElementById(
        "combo-date-end"
    ).value =
        programacion.fecha_fin ||
        "";

    document.getElementById(
        "combo-time-start"
    ).value =
        programacion
            .hora_inicio
            ?.slice(
                0,
                5
            ) ||
        "";

    document.getElementById(
        "combo-time-end"
    ).value =
        programacion
            .hora_fin
            ?.slice(
                0,
                5
            ) ||
        "";

    const dias =
        (
            programacion
                .dias_semana ||
            [
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ]
        )
            .map(Number);

    document
        .querySelectorAll(
            "#combo-days input"
        )
        .forEach(
            input => {

                input.checked =
                    dias.includes(
                        Number(
                            input.value
                        )
                    );

            }
        );

    document.getElementById(
        "combo-form"
    ).scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}

function limpiarCombo() {

    document.getElementById(
        "combo-form"
    ).reset();

    document.getElementById(
        "combo-id"
    ).value =
        "";

    document.getElementById(
        "combo-active"
    ).checked =
        true;

    document
        .querySelectorAll(
            "#combo-days input"
        )
        .forEach(
            input => {

                input.checked =
                    true;

            }
        );

    menuAdminState.comboItems =
        [];

    renderizarItemsCombo();

}

async function guardarCombo(
    evento
) {

    evento.preventDefault();

    const Admin =
        obtenerAdmin();

    if (
        !menuAdminState
            .comboItems
            .length
    ) {

        Admin.setStatus(
            "Agrega al menos un plato al combo.",
            "error"
        );

        return;

    }

    const dias = [

        ...document
            .querySelectorAll(
                "#combo-days input:checked"
            )

    ].map(
        input =>
            Number(
                input.value
            )
    );

    if (!dias.length) {

        Admin.setStatus(
            "Selecciona al menos un día.",
            "error"
        );

        return;

    }

    try {

        Admin.setStatus(
            "Guardando combo..."
        );

        const archivo =
            document
                .getElementById(
                    "combo-image"
                )
                .files[0];

        let imagen = null;

        if (archivo) {

            imagen =
                await LaFondaImages
                    .compress(
                        archivo
                    );

        }

        await Admin.rpc(
            "web_admin_guardar_combo",
            {

                p_id:
                    Admin.numeroONull(
                        "combo-id"
                    ),

                p_nombre:
                    Admin.val(
                        "combo-name"
                    ),

                p_descripcion:
                    Admin.val(
                        "combo-description"
                    ),

                p_precio:
                    Number(
                        Admin.val(
                            "combo-price"
                        )
                    ),

                p_activo:
                    document
                        .getElementById(
                            "combo-active"
                        )
                        .checked,

                p_items:
                    menuAdminState
                        .comboItems
                        .map(
                            item => ({

                                plato_id:
                                    item.plato_id,

                                cantidad:
                                    item.cantidad

                            })
                        ),

                p_dias:
                    dias,

                p_fecha_inicio:
                    Admin.val(
                        "combo-date-start"
                    ) ||
                    null,

                p_fecha_fin:
                    Admin.val(
                        "combo-date-end"
                    ) ||
                    null,

                p_hora_inicio:
                    Admin.val(
                        "combo-time-start"
                    ) ||
                    null,

                p_hora_fin:
                    Admin.val(
                        "combo-time-end"
                    ) ||
                    null,

                p_imagen_base64:
                    imagen?.base64 ||
                    null,

                p_imagen_mime:
                    imagen?.mime ||
                    null

            }
        );

        Admin.setStatus(
            "Combo guardado correctamente.",
            "success"
        );

        limpiarCombo();

        await cargarCombos();

    }

    catch (error) {

        console.error(
            "Error guardando combo:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

function configurarDropzone() {

    const zona =
        document.getElementById(
            "combo-dropzone"
        );

    zona.addEventListener(
        "dragover",
        evento => {

            evento.preventDefault();

            zona.classList.add(
                "dragover"
            );

        }
    );

    zona.addEventListener(
        "dragleave",
        () => {

            zona.classList.remove(
                "dragover"
            );

        }
    );

    zona.addEventListener(
        "drop",
        evento => {

            evento.preventDefault();

            zona.classList.remove(
                "dragover"
            );

            const id =
                Number(
                    evento
                        .dataTransfer
                        .getData(
                            "text/plain"
                        )
                );

            if (id) {

                agregarItemCombo(id);

            }

        }
    );

}

function configurarCombos() {

    configurarDropzone();

    document.getElementById(
        "combo-search"
    ).addEventListener(
        "input",
        renderizarPlatosCombo
    );

    document.getElementById(
        "combo-new"
    ).addEventListener(
        "click",
        limpiarCombo
    );

    document.getElementById(
        "combo-clear"
    ).addEventListener(
        "click",
        limpiarCombo
    );

    document.getElementById(
        "combo-form"
    ).addEventListener(
        "submit",
        guardarCombo
    );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const Admin =
            obtenerAdmin();

        if (
            !Admin ||
            !Admin.verificarAcceso()
        ) {

            return;

        }

        configurarSubnavMenu();

        configurarPlatos();

        configurarCombos();

        await cargarPlatos();

        await cargarCombos();

    }
);