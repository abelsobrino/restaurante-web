const CARRITO_KEY =
    "lafonda_carrito";

const MAX_PER_ITEM =
    10;

const cartaState = {

    catalogo: {

        categorias: [],

        platos: [],

        combos: [],

        cupones: [],

        horario: null

    },

    grupos: [],

    gruposFiltrados: [],

    carrito: [],

    categoria:
        "all",

    seleccionPorGrupo:
        {}

};

function cartaDinero(valor) {

    return `S/ ${Number(
        valor || 0
    ).toFixed(2)}`;

}

function escaparCarta(valor) {

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

function imagenCarta(item) {

    return String(
        item?.imagen || ""
    ).trim();

}

function normalizarTexto(valor) {

    return String(
        valor || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim()
        .toLowerCase();

}

function tiendaAbierta() {

    const horario =
        cartaState.catalogo.horario;

    return (
        !horario ||
        horario.abierto !== false
    );

}

function mensajeHorario() {

    const horario =
        cartaState.catalogo.horario;

    if (!horario) {
        return "";
    }

    if (horario.cerrado_hoy) {
        return "Hoy no atendemos. Vuelve a revisar mañana.";
    }

    return `Cerrado por ahora. Abrimos hoy a las ${horario.hora_apertura}, hasta las ${horario.hora_cierre}.`;

}

function renderHorarioBanner() {

    const banner =
        document.getElementById(
            "horario-banner"
        );

    if (!banner) {
        return;
    }

    if (tiendaAbierta()) {

        banner.hidden =
            true;

        banner.innerHTML =
            "";

        return;

    }

    banner.hidden =
        false;

    banner.innerHTML =
        `<i class="fa-solid fa-circle-exclamation"></i> ${escaparCarta(
            mensajeHorario()
        )} Puedes seguir viendo la carta, pero los pedidos se habilitan dentro del horario de atención.`;

}

function stockDisponible(item) {

    if (window.LaFondaStock) {
        return window.LaFondaStock.info(item).disponible;
    }

    return (
        item?.disponible !== false &&
        item?.activo !== false
    );

}

function extraerPorcion(nombre) {

    const texto =
        String(
            nombre || ""
        ).trim();

    const coincidencia =
        texto.match(
            /^(.*?)\s*(?:[-–—]\s*)?(?:x|×)\s*(\d+)\s*$/i
        );

    if (!coincidencia) {

        return null;

    }

    const base =
        String(
            coincidencia[1] ||
            ""
        )
            .replace(
                /[-–—]\s*$/,
                ""
            )
            .trim();

    const porcion =
        Number(
            coincidencia[2]
        );

    if (
        !base ||
        !Number.isInteger(
            porcion
        ) ||
        porcion <= 0
    ) {

        return null;

    }

    return {

        base,

        porcion

    };

}

function agruparPlatos() {

    const temporales =
        new Map();

    const individuales =
        [];

    cartaState
        .catalogo
        .platos
        .forEach(
            plato => {

                const informacion =
                    extraerPorcion(
                        plato.nombre
                    );

                if (!informacion) {

                    individuales.push({

                        clave:
                            `individual-${plato.id}`,

                        nombreBase:
                            plato.nombre,

                        categoria_id:
                            plato.categoria_id,

                        categoria:
                            plato.categoria,

                        agrupado:
                            false,

                        variantes: [

                            {

                                ...plato,

                                porcion:
                                    null

                            }

                        ]

                    });

                    return;

                }

                const claveBase =

                    `${String(
                        plato.categoria_id
                    )}::` +

                    normalizarTexto(
                        informacion.base
                    );

                if (
                    !temporales.has(
                        claveBase
                    )
                ) {

                    temporales.set(
                        claveBase,
                        {

                            clave:
                                `grupo-${claveBase}`,

                            nombreBase:
                                informacion.base,

                            categoria_id:
                                plato.categoria_id,

                            categoria:
                                plato.categoria,

                            agrupado:
                                true,

                            variantes:
                                []

                        }
                    );

                }

                temporales
                    .get(
                        claveBase
                    )
                    .variantes
                    .push({

                        ...plato,

                        porcion:
                            informacion.porcion

                    });

            }
        );

    const agrupados = [];

    temporales.forEach(
        grupo => {

            if (
                grupo.variantes.length >= 2
            ) {

                grupo.variantes.sort(
                    (
                        a,
                        b
                    ) =>

                        Number(
                            a.porcion
                        ) -

                        Number(
                            b.porcion
                        )
                );

                agrupados.push(
                    grupo
                );

            }

            else {

                const variante =
                    grupo.variantes[0];

                individuales.push({

                    clave:
                        `individual-${variante.id}`,

                    nombreBase:
                        variante.nombre,

                    categoria_id:
                        variante.categoria_id,

                    categoria:
                        variante.categoria,

                    agrupado:
                        false,

                    variantes: [
                        variante
                    ]

                });

            }

        }
    );

    cartaState.grupos = [

        ...individuales,
        ...agrupados

    ].sort(
        (
            a,
            b
        ) =>

            obtenerIdMinimoGrupo(a) -
            obtenerIdMinimoGrupo(b)
    );

    cartaState.gruposFiltrados = [

        ...cartaState.grupos

    ];

}

function obtenerIdMinimoGrupo(
    grupo
) {

    return Math.min(

        ...grupo
            .variantes
            .map(
                variante =>
                    Number(
                        variante.id
                    )
            )

    );

}

function obtenerVarianteSeleccionada(
    grupo
) {

    const idSeleccionado =
        Number(
            cartaState
                .seleccionPorGrupo[
                    grupo.clave
                ] ||
            0
        );

    const seleccionada =
        grupo
            .variantes
            .find(
                variante =>

                    Number(
                        variante.id
                    ) ===
                    idSeleccionado
            );

    if (
        seleccionada &&
        stockDisponible(
            seleccionada
        )
    ) {

        return seleccionada;

    }

    const disponible =
        grupo
            .variantes
            .find(
                stockDisponible
            );

    return disponible ||
        grupo.variantes[0];

}

function obtenerPrecioGrupo(
    grupo
) {

    return Math.min(

        ...grupo
            .variantes
            .map(
                variante =>

                    Number(
                        variante.precio ||
                        0
                    )
            )

    );

}

function toast(
    mensaje,
    tipo = "success"
) {

    let contenedor =
        document.getElementById(
            "toast-container"
        );

    if (!contenedor) {

        contenedor =
            document.createElement(
                "div"
            );

        contenedor.id =
            "toast-container";

        document.body.appendChild(
            contenedor
        );

    }

    const elemento =
        document.createElement(
            "div"
        );

    elemento.className =
        tipo === "error"

            ? "custom-toast error-toast"

            : "custom-toast";

    elemento.textContent =
        mensaje;

    contenedor.appendChild(
        elemento
    );

    setTimeout(
        () => {

            elemento.remove();

        },
        2600
    );

}

window.launchToast =
    toast;

function normalizarItemCarrito(
    producto
) {

    const tipo =
        producto.tipo ||
        "PLATO";

    const id =
        Number(
            producto.id ||
            0
        );

    const extra =
        producto.extra ||
        "";

    return {

        tipo,

        id,

        nombre:
            producto.nombre ||
            producto.name ||
            "Producto",

        precio:
            Number(
                producto.precio ??
                producto.price ??
                0
            ),

        imagen:
            producto.imagen ||
            producto.img ||
            "",

        cantidad:
            Number(
                producto.cantidad ??
                producto.qty ??
                1
            ),

        extra,

        clave:
            producto.clave ||
            producto.key ||
            `${tipo}:${id}:${extra}`

    };

}

function cargarCarritoGuardado() {

    try {

        const datos =
            JSON.parse(
                sessionStorage.getItem(
                    CARRITO_KEY
                ) ||
                "[]"
            );

        cartaState.carrito =
            Array.isArray(
                datos
            )

                ? datos
                    .map(
                        normalizarItemCarrito
                    )
                    .filter(
                        producto =>

                            producto.id &&
                            producto.cantidad > 0
                    )

                : [];

    }

    catch (error) {

        console.error(
            "No se pudo leer el carrito:",
            error
        );

        cartaState.carrito =
            [];

    }

    guardarCarrito();

}

function guardarCarrito() {

    sessionStorage.setItem(
        CARRITO_KEY,
        JSON.stringify(
            cartaState.carrito
        )
    );

}

function actualizarCarritoCarta() {

    const cantidad =
        cartaState
            .carrito
            .reduce(

                (
                    total,
                    producto
                ) =>

                    total +
                    Number(
                        producto.cantidad ||
                        0
                    ),

                0

            );

    const contadorDesktop =
        document.getElementById(
            "cart-count"
        );

    const contadorMovil =
        document.getElementById(
            "mobile-cart-badge"
        );

    if (contadorDesktop) {

        contadorDesktop.textContent =
            cantidad;

    }

    if (contadorMovil) {

        contadorMovil.textContent =
            cantidad;

    }

}

function agregarAlCarrito(
    item
) {

    const producto =
        normalizarItemCarrito(
            item
        );

    producto.clave =
        `${producto.tipo}:${producto.id}:${producto.extra || ""}`;

    const existente =
        cartaState
            .carrito
            .find(
                actual =>

                    actual.clave ===
                    producto.clave
            );

    if (existente) {

        if (
            existente.cantidad >=
            MAX_PER_ITEM
        ) {

            toast(
                `Máximo ${MAX_PER_ITEM} unidades por producto`,
                "error"
            );

            return;

        }

        existente.cantidad++;

    }

    else {

        producto.cantidad =
            1;

        cartaState
            .carrito
            .push(
                producto
            );

    }

    guardarCarrito();

    actualizarCarritoCarta();

    toast(
        `Agregado: ${producto.nombre}`
    );

}

async function cargarCatalogo() {

    const estado =
        document.getElementById(
            "catalog-status"
        );

    try {

        estado.hidden =
            false;

        estado.textContent =
            "Cargando platos...";

        const resultado =
            await LaFondaDB.rpc(
                "web_catalogo",
                {}
            );

        if (
            window.LaFondaStock?.enriquecerCatalogo
        ) {

            await window.LaFondaStock
                .enriquecerCatalogo(
                    resultado
                );

        }

        cartaState.catalogo = {

            categorias:
                resultado?.categorias ||
                [],

            platos:
                resultado?.platos ||
                [],

            combos:
                resultado?.combos ||
                [],

            cupones:
                resultado?.cupones ||
                [],

            horario:
                resultado?.horario ||
                null

        };

        agruparPlatos();

        renderizarCategorias();

        aplicarFiltros();

        renderizarCombos();

        renderHorarioBanner();

        mostrarPromocionDisponible();

        estado.hidden =
            true;

    }

    catch (error) {

        console.error(
            "Error cargando carta:",
            error
        );

        estado.hidden =
            false;

        estado.innerHTML = `

            <strong>
                No se pudo cargar la carta.
            </strong>

            <br>

            ${escaparCarta(
                error.message
            )}

        `;

    }

}

function renderizarCategorias() {

    const contenedor =
        document.getElementById(
            "category-filters"
        );

    const categorias =
        cartaState
            .catalogo
            .categorias;

    contenedor.innerHTML = `

        <button
            type="button"
            class="category-chip active"
            data-category="all"
        >
            Todos
        </button>

        ${categorias
            .map(
                categoria => `

                    <button
                        type="button"
                        class="category-chip"
                        data-category="${Number(
                            categoria.id
                        )}"
                    >

                        ${escaparCarta(
                            categoria.nombre
                        )}

                    </button>

                `
            )
            .join("")}

    `;

    contenedor
        .querySelectorAll(
            ".category-chip"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        cartaState.categoria =
                            boton.dataset.category;

                        contenedor
                            .querySelectorAll(
                                ".category-chip"
                            )
                            .forEach(
                                otro => {

                                    otro.classList.toggle(

                                        "active",

                                        otro === boton

                                    );

                                }
                            );

                        aplicarFiltros();

                    }
                );

            }
        );

}

function aplicarFiltros() {

    const busqueda =
        document
            .getElementById(
                "filter-search"
            )
            .value
            .trim()
            .toLowerCase();

    const precio =
        document.getElementById(
            "filter-price"
        ).value;

    const orden =
        document.getElementById(
            "filter-sort"
        ).value;

    let grupos = [

        ...cartaState.grupos

    ];

    if (
        cartaState.categoria !==
        "all"
    ) {

        grupos =
            grupos.filter(
                grupo =>

                    String(
                        grupo.categoria_id
                    ) ===
                    String(
                        cartaState.categoria
                    )
            );

    }

    if (busqueda) {

        grupos =
            grupos.filter(
                grupo => {

                    const variantes =
                        grupo
                            .variantes
                            .map(
                                variante =>

                                    `${variante.nombre || ""} ${variante.descripcion || ""}`
                            )
                            .join(
                                " "
                            );

                    const texto =

                        `${grupo.nombreBase || ""} ` +

                        `${grupo.categoria || ""} ` +

                        variantes;

                    return normalizarTexto(
                        texto
                    ).includes(
                        normalizarTexto(
                            busqueda
                        )
                    );

                }
            );

    }

    if (
        precio !==
        "all"
    ) {

        grupos =
            grupos.filter(
                grupo => {

                    const valor =
                        obtenerPrecioGrupo(
                            grupo
                        );

                    if (
                        precio ===
                        "0-15"
                    ) {

                        return (
                            valor < 15
                        );

                    }

                    if (
                        precio ===
                        "15-30"
                    ) {

                        return (
                            valor >= 15 &&
                            valor <= 30
                        );

                    }

                    if (
                        precio ===
                        "30-50"
                    ) {

                        return (
                            valor > 30 &&
                            valor <= 50
                        );

                    }

                    return (
                        valor > 50
                    );

                }
            );

    }

    if (
        orden ===
        "price-asc"
    ) {

        grupos.sort(
            (
                a,
                b
            ) =>

                obtenerPrecioGrupo(a) -
                obtenerPrecioGrupo(b)
        );

    }

    else if (
        orden ===
        "price-desc"
    ) {

        grupos.sort(
            (
                a,
                b
            ) =>

                obtenerPrecioGrupo(b) -
                obtenerPrecioGrupo(a)
        );

    }

    else if (
        orden ===
        "name"
    ) {

        grupos.sort(
            (
                a,
                b
            ) =>

                String(
                    a.nombreBase ||
                    ""
                ).localeCompare(
                    String(
                        b.nombreBase ||
                        ""
                    ),
                    "es"
                )
        );

    }

    cartaState.gruposFiltrados =
        grupos;

    renderizarCatalogo();

}

function crearImagenCarta(
    item
) {

    const imagen =
        imagenCarta(
            item
        );

    if (!imagen) {

        return `

            <div class="menu-sin-imagen">

                IMAGEN NO DISPONIBLE

            </div>

        `;

    }

    return `

        <img
            src="${escaparCarta(
                imagen
            )}"
            alt="${escaparCarta(
                item.nombre
            )}"
            loading="lazy"
        >

    `;

}

function crearSelectorPorciones(
    grupo,
    seleccionada,
    indice
) {

    if (
        !grupo.agrupado ||
        grupo.variantes.length < 2
    ) {

        return "";

    }

    return `

        <div class="portion-selector">

            <span class="portion-label">
                Elige tu porción
            </span>

            <div
                class="portion-options"
                role="group"
                aria-label="Seleccionar porción"
            >

                ${grupo.variantes
                    .map(
                        variante => {

                            const activo =

                                Number(
                                    variante.id
                                ) ===
                                Number(
                                    seleccionada.id
                                );

                            const disponible =
                                stockDisponible(
                                    variante
                                );

                            return `

                                <button
                                    type="button"
                                    class="portion-option ${
                                        activo
                                            ? "active"
                                            : ""
                                    } ${
                                        disponible
                                            ? ""
                                            : "agotada"
                                    }"
                                    data-group-index="${indice}"
                                    data-variant-id="${Number(
                                        variante.id
                                    )}"
                                    aria-pressed="${
                                        activo
                                            ? "true"
                                            : "false"
                                    }"
                                    ${
                                        disponible
                                            ? ""
                                            : "disabled"
                                    }
                                    title="${
                                        disponible
                                            ? `Porción x${Number(variante.porcion)}`
                                            : "Agotado"
                                    }"
                                >

                                    x${Number(
                                        variante.porcion
                                    )}

                                </button>

                            `;

                        }
                    )
                    .join("")}

            </div>

        </div>

    `;

}

function renderizarCatalogo() {

    const grid =
        document.getElementById(
            "menu-grid"
        );

    if (
        !cartaState
            .gruposFiltrados
            .length
    ) {

        grid.innerHTML = `

            <div class="catalog-empty">

                No encontramos platos
                para estos filtros.

            </div>

        `;

        return;

    }

    grid.innerHTML =
        cartaState
            .gruposFiltrados
            .map(
                (
                    grupo,
                    indice
                ) => {

                    const variante =
                        obtenerVarianteSeleccionada(
                            grupo
                        );

                    const disponible =
                        stockDisponible(
                            variante
                        );

                    cartaState
                        .seleccionPorGrupo[
                            grupo.clave
                        ] =
                        variante.id;

                    return `

                        <article
                            class="menu-item${
                                disponible
                                    ? ""
                                    : " agotado"
                            }"
                            data-group-index="${indice}"
                        >

                            <div
                                class="menu-img-container"
                                data-group-image="${indice}"
                            >

                                ${crearImagenCarta(
                                    variante
                                )}

                            </div>

                            <div class="menu-info">

                                <span class="menu-category-label">

                                    ${escaparCarta(
                                        grupo.categoria ||
                                        ""
                                    )}

                                </span>

                                <h3>

                                    ${escaparCarta(
                                        grupo.agrupado
                                            ? grupo.nombreBase
                                            : variante.nombre
                                    )}

                                    <span
                                        class="stock-badge"
                                        data-group-stock="${indice}"
                                        ${disponible
                                            ? "hidden"
                                            : ""}
                                    >
                                        Agotado
                                    </span>

                                </h3>

                                <p
                                    class="menu-description"
                                    data-group-description="${indice}"
                                >

                                    ${escaparCarta(
                                        variante.descripcion ||
                                        ""
                                    )}

                                </p>

                                ${crearSelectorPorciones(
                                    grupo,
                                    variante,
                                    indice
                                )}

                                <div class="menu-footer">

                                    <span
                                        class="price"
                                        data-group-price="${indice}"
                                    >

                                        ${cartaDinero(
                                            variante.precio
                                        )}

                                    </span>

                                    <button
                                        type="button"
                                        class="btn-add"
                                        data-add-group="${indice}"
                                        aria-label="Agregar ${escaparCarta(
                                            variante.nombre
                                        )}"
                                        ${disponible
                                            ? ""
                                            : "disabled"}
                                    >
                                        +
                                    </button>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

    configurarSelectoresPorcion();

    configurarBotonesAgregarPlatos();

}

function seleccionarPorcion(
    indiceGrupo,
    idVariante
) {

    const grupo =
        cartaState
            .gruposFiltrados[
                indiceGrupo
            ];

    if (!grupo) {

        return;

    }

    const variante =
        grupo
            .variantes
            .find(
                item =>

                    Number(
                        item.id
                    ) ===
                    Number(
                        idVariante
                    )
            );

    if (!variante) {

        return;

    }

    if (
        !stockDisponible(
            variante
        )
    ) {

        return;

    }

    cartaState
        .seleccionPorGrupo[
            grupo.clave
        ] =
        variante.id;

    const tarjeta =
        document.querySelector(
            `.menu-item[data-group-index="${indiceGrupo}"]`
        );

    if (!tarjeta) {

        return;

    }

    const disponible =
        stockDisponible(
            variante
        );

    tarjeta.classList.toggle(
        "agotado",
        !disponible
    );

    const indicadorStock =
        tarjeta.querySelector(
            `[data-group-stock="${indiceGrupo}"]`
        );

    if (indicadorStock) {
        indicadorStock.hidden =
            disponible;
    }

    tarjeta
        .querySelectorAll(
            ".portion-option"
        )
        .forEach(
            boton => {

                const activo =

                    Number(
                        boton.dataset
                            .variantId
                    ) ===
                    Number(
                        variante.id
                    );

                boton.classList.toggle(
                    "active",
                    activo
                );

                boton.setAttribute(
                    "aria-pressed",
                    activo
                        ? "true"
                        : "false"
                );

            }
        );

    const precio =
        tarjeta.querySelector(
            `[data-group-price="${indiceGrupo}"]`
        );

    if (precio) {

        precio.textContent =
            cartaDinero(
                variante.precio
            );

    }

    const descripcion =
        tarjeta.querySelector(
            `[data-group-description="${indiceGrupo}"]`
        );

    if (descripcion) {

        descripcion.textContent =
            variante.descripcion ||
            "";

    }

    const imagen =
        tarjeta.querySelector(
            `[data-group-image="${indiceGrupo}"]`
        );

    if (imagen) {

        imagen.innerHTML =
            crearImagenCarta(
                variante
            );

    }

    const agregar =
        tarjeta.querySelector(
            "[data-add-group]"
        );

    if (agregar) {

        agregar.setAttribute(
            "aria-label",
            `Agregar ${variante.nombre}`
        );

        agregar.disabled =
            !disponible;

    }

}

function configurarSelectoresPorcion() {

    document
        .querySelectorAll(
            ".portion-option"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        seleccionarPorcion(

                            Number(
                                boton.dataset
                                    .groupIndex
                            ),

                            Number(
                                boton.dataset
                                    .variantId
                            )

                        );

                    }
                );

            }
        );

}

function configurarBotonesAgregarPlatos() {

    document
        .querySelectorAll(
            "[data-add-group]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        const indice =
                            Number(
                                boton.dataset
                                    .addGroup
                            );

                        const grupo =
                            cartaState
                                .gruposFiltrados[
                                    indice
                                ];

                        if (!grupo) {

                            return;

                        }

                        const variante =
                            obtenerVarianteSeleccionada(
                                grupo
                            );

                        if (!variante) {

                            return;

                        }

                        if (!tiendaAbierta()) {

                            toast(
                                mensajeHorario(),
                                "error"
                            );

                            return;

                        }

                        if (
                            !stockDisponible(
                                variante
                            )
                        ) {

                            toast(
                                "Este plato está agotado.",
                                "error"
                            );

                            return;

                        }

                        agregarAlCarrito({

                            tipo:
                                "PLATO",

                            id:
                                Number(
                                    variante.id
                                ),

                            nombre:
                                variante.nombre,

                            precio:
                                Number(
                                    variante.precio
                                ),

                            imagen:
                                variante.imagen

                        });

                    }
                );

            }
        );

}

function renderizarCombos() {

    const combos =
        cartaState
            .catalogo
            .combos;

    const seccion =
        document.getElementById(
            "combos-section"
        );

    const grid =
        document.getElementById(
            "combos-grid"
        );

    if (!combos.length) {

        seccion.hidden =
            true;

        grid.innerHTML =
            "";

        return;

    }

    seccion.hidden =
        false;

    grid.innerHTML =
        combos
            .map(
                combo => `

                    <article
                        class="menu-item combo-card"
                        data-combo-id="${Number(
                            combo.id
                        )}"
                    >

                        <div class="menu-img-container">

                            ${crearImagenCarta(
                                combo
                            )}

                        </div>

                        <div class="menu-info">

                            <span class="menu-category-label">
                                COMBO
                            </span>

                            <h3>

                                ${escaparCarta(
                                    combo.nombre
                                )}

                            </h3>

                            <p>

                                ${escaparCarta(
                                    combo.descripcion ||
                                    ""
                                )}

                            </p>

                            ${
                                Array.isArray(
                                    combo.items
                                ) &&
                                combo.items.length

                                    ? `

                                        <small class="combo-components">

                                            ${combo.items
                                                .map(
                                                    item =>

                                                        `${Number(
                                                            item.cantidad ||
                                                            1
                                                        )}× ${escaparCarta(
                                                            item.nombre
                                                        )}`
                                                )
                                                .join(
                                                    " · "
                                                )}

                                        </small>

                                    `

                                    : ""
                            }

                            <div class="menu-footer">

                                <span class="price">

                                    ${cartaDinero(
                                        combo.precio
                                    )}

                                </span>

                                <button
                                    type="button"
                                    class="btn-add"
                                    data-add-combo="${Number(
                                        combo.id
                                    )}"
                                    aria-label="Agregar ${escaparCarta(
                                        combo.nombre
                                    )}"
                                >
                                    +
                                </button>

                            </div>

                        </div>

                    </article>

                `
            )
            .join("");

    configurarBotonesCombos();

}

function configurarBotonesCombos() {

    document
        .querySelectorAll(
            "[data-add-combo]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                boton.dataset
                                    .addCombo
                            );

                        const combo =
                            cartaState
                                .catalogo
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

                        if (!tiendaAbierta()) {

                            toast(
                                mensajeHorario(),
                                "error"
                            );

                            return;

                        }

                        agregarAlCarrito({

                            tipo:
                                "COMBO",

                            id:
                                Number(
                                    combo.id
                                ),

                            nombre:
                                combo.nombre,

                            precio:
                                Number(
                                    combo.precio
                                ),

                            imagen:
                                combo.imagen

                        });

                    }
                );

            }
        );

}

function mostrarPromocionDisponible() {

    const cupon =
        cartaState
            .catalogo
            .cupones[0];

    if (!cupon) {

        return;

    }

    const clave =
        `lafonda_coupon_seen_${cupon.id}`;

    if (
        localStorage.getItem(
            clave
        )
    ) {

        return;

    }

    localStorage.setItem(
        clave,
        "1"
    );

    const overlay =
        document.createElement(
            "div"
        );

    overlay.className =
        "welcome-overlay";

    overlay.innerHTML = `

        <div class="welcome-card">

            <h2>
                <i class="fa-solid fa-fire"></i> Promoción disponible
            </h2>

            <p>

                ${escaparCarta(
                    cupon.descripcion ||
                    "Tenemos un cupón disponible para ti."
                )}

            </p>

            <div class="promo-code">

                ${escaparCarta(
                    cupon.codigo
                )}

            </div>

            <button
                type="button"
                class="carta-boton"
                id="close-promo"
            >
                Ver la carta
            </button>

        </div>

    `;

    document.body.appendChild(
        overlay
    );

    overlay
        .querySelector(
            "#close-promo"
        )
        .addEventListener(
            "click",
            () => {

                overlay.remove();

            }
        );

}

function configurarEventosCarta() {

    document.getElementById(
        "filter-search"
    ).addEventListener(
        "input",
        aplicarFiltros
    );

    document.getElementById(
        "filter-price"
    ).addEventListener(
        "change",
        aplicarFiltros
    );

    document.getElementById(
        "filter-sort"
    ).addEventListener(
        "change",
        aplicarFiltros
    );

    document.getElementById(
        "mobile-cart-toggle"
    ).addEventListener(
        "click",
        () => {

            window.location.href =
                "/paginas/pedidos/carrito/";

        }
    );

}

function refrescarCarritoCarta() {

    cargarCarritoGuardado();

    actualizarCarritoCarta();

}

window.addEventListener(
    "pageshow",
    refrescarCarritoCarta
);

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        cargarCarritoGuardado();

        actualizarCarritoCarta();

        configurarEventosCarta();

        await cargarCatalogo();

    }
);