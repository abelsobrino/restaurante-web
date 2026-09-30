const promocionesState = {

    cupones: [],

    filtro:
        "TODOS",

    busqueda:
        ""

};

function promocionesAdmin() {

    return window.LaFondaAdmin;

}

async function cargarCupones() {

    const Admin =
        promocionesAdmin();

    try {

        Admin.setStatus(
            "Cargando cupones..."
        );

        const datos =
            await Admin.rpc(
                "web_admin_cupones"
            );

        promocionesState.cupones =
            Array.isArray(datos)
                ? datos
                : [];

        renderizarCupones();

        actualizarResumenCupones();

        Admin.setStatus("");

    }

    catch (error) {

        console.error(
            "Error cargando cupones:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

function actualizarResumenCupones() {

    const cupones =
        promocionesState.cupones;

    const resumen =
        document.getElementById(
            "coupon-summary"
        );

    if (!cupones.length) {

        resumen.hidden =
            true;

        return;

    }

    const activos =
        cupones.filter(
            cupon =>
                cupon.activo
        ).length;

    const publicos =
        cupones.filter(
            cupon =>
                cupon.visible_publico
        ).length;

    const usos =
        cupones.reduce(
            (total, cupon) =>

                total +
                Number(
                    cupon.usos ||
                    0
                ),

            0
        );

    document.getElementById(
        "coupon-total"
    ).textContent =
        cupones.length;

    document.getElementById(
        "coupon-active-count"
    ).textContent =
        activos;

    document.getElementById(
        "coupon-public-count"
    ).textContent =
        publicos;

    document.getElementById(
        "coupon-uses-count"
    ).textContent =
        usos;

    resumen.hidden =
        false;

}

function cuponCoincideFiltro(
    cupon
) {

    switch (
        promocionesState.filtro
    ) {

        case "ACTIVOS":

            return Boolean(
                cupon.activo
            );

        case "INACTIVOS":

            return !cupon.activo;

        case "PUBLICOS":

            return Boolean(
                cupon.visible_publico
            );

        case "OCULTOS":

            return !cupon.visible_publico;

        default:

            return true;

    }

}

function cuponCoincideBusqueda(
    cupon
) {

    const termino =
        promocionesState
            .busqueda
            .trim()
            .toLowerCase();

    if (!termino) {

        return true;

    }

    return (

        String(
            cupon.codigo ||
            ""
        )
            .toLowerCase()
            .includes(
                termino
            )

        ||

        String(
            cupon.descripcion ||
            ""
        )
            .toLowerCase()
            .includes(
                termino
            )

    );

}

function textoValorCupon(
    cupon
) {

    const Admin =
        promocionesAdmin();

    if (
        cupon.tipo ===
        "PORCENTAJE"
    ) {

        return (
            `${Number(
                cupon.valor ||
                0
            )}%`
        );

    }

    return Admin.money(
        cupon.valor
    );

}

function textoVigenciaCupon(
    cupon
) {

    const inicio =
        cupon.fecha_inicio
            ? formatearFechaCorta(
                cupon.fecha_inicio
            )
            : null;

    const fin =
        cupon.fecha_fin
            ? formatearFechaCorta(
                cupon.fecha_fin
            )
            : null;

    if (
        inicio &&
        fin
    ) {

        return (
            `${inicio} → ${fin}`
        );

    }

    if (inicio) {

        return (
            `Desde ${inicio}`
        );

    }

    if (fin) {

        return (
            `Hasta ${fin}`
        );

    }

    return "Sin fecha límite";

}

function formatearFechaCorta(
    valor
) {

    const fecha =
        new Date(valor);

    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "-";

    }

    return fecha.toLocaleDateString(
        "es-PE",
        {

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric"

        }
    );

}

function renderizarCupones() {

    const Admin =
        promocionesAdmin();

    const contenedor =
        document.getElementById(
            "coupon-list"
        );

    const cupones =
        promocionesState
            .cupones
            .filter(
                cuponCoincideFiltro
            )
            .filter(
                cuponCoincideBusqueda
            );

    if (!cupones.length) {

        contenedor.innerHTML = `

            <div class="empty-admin">

                No se encontraron cupones.

            </div>

        `;

        return;

    }

    const actual =
        Number(
            document.getElementById(
                "coupon-id"
            ).value ||
            0
        );

    contenedor.innerHTML =
        cupones
            .map(
                cupon => `

                    <article
                        class="coupon-admin-card ${
                            Number(
                                cupon.id
                            ) === actual
                                ? "selected"
                                : ""
                        }"
                        data-coupon-id="${Number(
                            cupon.id
                        )}"
                    >

                        <div class="coupon-admin-header">

                            <span class="coupon-admin-code">

                                ${Admin.esc(
                                    cupon.codigo
                                )}

                            </span>

                            <span class="coupon-admin-value">

                                ${textoValorCupon(
                                    cupon
                                )}

                            </span>

                        </div>

                        <p class="coupon-admin-description">

                            ${Admin.esc(
                                cupon.descripcion ||
                                "Sin descripción"
                            )}

                        </p>

                        <p class="coupon-admin-description">

                            Compra mínima:
                            ${Admin.money(
                                cupon.minimo_compra
                            )}

                            <br>

                            ${Admin.esc(
                                textoVigenciaCupon(
                                    cupon
                                )
                            )}

                        </p>

                        <div class="coupon-admin-meta">

                            <span
                                class="coupon-pill ${
                                    cupon.activo
                                        ? "active"
                                        : "inactive"
                                }"
                            >

                                ${
                                    cupon.activo
                                        ? "Activo"
                                        : "Inactivo"
                                }

                            </span>

                            <span
                                class="coupon-pill ${
                                    cupon.visible_publico
                                        ? "public"
                                        : "private"
                                }"
                            >

                                ${
                                    cupon.visible_publico
                                        ? "Público"
                                        : "Oculto"
                                }

                            </span>

                            <span class="coupon-uses">

                                ${Number(
                                    cupon.usos ||
                                    0
                                )}

                                usos

                            </span>

                        </div>

                    </article>

                `
            )
            .join("");

    contenedor
        .querySelectorAll(
            "[data-coupon-id]"
        )
        .forEach(
            tarjeta => {

                tarjeta.addEventListener(
                    "click",
                    () => {

                        editarCupon(
                            Number(
                                tarjeta
                                    .dataset
                                    .couponId
                            )
                        );

                    }
                );

            }
        );

}

function convertirAInputLocal(
    valor
) {

    if (!valor) {

        return "";

    }

    const fecha =
        new Date(valor);

    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "";

    }

    const dos =
        numero =>
            String(numero)
                .padStart(
                    2,
                    "0"
                );

    return (

        `${fecha.getFullYear()}-` +

        `${dos(
            fecha.getMonth() + 1
        )}-` +

        `${dos(
            fecha.getDate()
        )}T` +

        `${dos(
            fecha.getHours()
        )}:` +

        `${dos(
            fecha.getMinutes()
        )}`

    );

}

function editarCupon(id) {

    const cupon =
        promocionesState
            .cupones
            .find(
                item =>
                    Number(
                        item.id
                    ) ===
                    Number(id)
            );

    if (!cupon) {

        return;

    }

    document.getElementById(
        "coupon-id"
    ).value =
        cupon.id;

    document.getElementById(
        "coupon-code"
    ).value =
        cupon.codigo || "";

    document.getElementById(
        "coupon-description"
    ).value =
        cupon.descripcion || "";

    document.getElementById(
        "coupon-type"
    ).value =
        cupon.tipo ||
        "PORCENTAJE";

    document.getElementById(
        "coupon-value"
    ).value =
        cupon.valor ?? "";

    document.getElementById(
        "coupon-min"
    ).value =
        cupon.minimo_compra ??
        0;

    document.getElementById(
        "coupon-limit"
    ).value =
        cupon.limite_usos ??
        "";

    document.getElementById(
        "coupon-start"
    ).value =
        convertirAInputLocal(
            cupon.fecha_inicio
        );

    document.getElementById(
        "coupon-end"
    ).value =
        convertirAInputLocal(
            cupon.fecha_fin
        );

    document.getElementById(
        "coupon-visible"
    ).checked =
        Boolean(
            cupon.visible_publico
        );

    document.getElementById(
        "coupon-active"
    ).checked =
        Boolean(
            cupon.activo
        );

    document.getElementById(
        "coupon-form-title"
    ).textContent =
        `Editar ${cupon.codigo}`;

    actualizarTipoCupon();

    actualizarPreviewCupon();

    renderizarCupones();

    document.getElementById(
        "coupon-form"
    ).scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}

function limpiarCupon() {

    document.getElementById(
        "coupon-form"
    ).reset();

    document.getElementById(
        "coupon-id"
    ).value =
        "";

    document.getElementById(
        "coupon-min"
    ).value =
        "0";

    document.getElementById(
        "coupon-active"
    ).checked =
        true;

    document.getElementById(
        "coupon-visible"
    ).checked =
        false;

    document.getElementById(
        "coupon-form-title"
    ).textContent =
        "Nuevo cupón";

    actualizarTipoCupon();

    actualizarPreviewCupon();

    renderizarCupones();

}

function actualizarTipoCupon() {

    const tipo =
        document.getElementById(
            "coupon-type"
        ).value;

    const prefijo =
        document.getElementById(
            "coupon-value-prefix"
        );

    const valor =
        document.getElementById(
            "coupon-value"
        );

    if (
        tipo ===
        "PORCENTAJE"
    ) {

        prefijo.textContent =
            "%";

        valor.max =
            "100";

    }

    else {

        prefijo.textContent =
            "S/";

        valor.removeAttribute(
            "max"
        );

    }

    actualizarPreviewCupon();

}

function formatearCodigoCupon() {

    const input =
        document.getElementById(
            "coupon-code"
        );

    input.value =
        input.value
            .toUpperCase()
            .replace(
                /\s+/g,
                ""
            );

    actualizarPreviewCupon();

}

function actualizarPreviewCupon() {

    const tipo =
        document.getElementById(
            "coupon-type"
        ).value;

    const codigo =
        document
            .getElementById(
                "coupon-code"
            )
            .value
            .trim() ||
        "FONDA20";

    const descripcion =
        document
            .getElementById(
                "coupon-description"
            )
            .value
            .trim() ||
        "Tu promoción aparecerá aquí.";

    const valor =
        Number(
            document
                .getElementById(
                    "coupon-value"
                )
                .value ||
            0
        );

    document.getElementById(
        "coupon-preview-code"
    ).textContent =
        codigo;

    document.getElementById(
        "coupon-preview-description"
    ).textContent =
        descripcion;

    document.getElementById(
        "coupon-preview-value"
    ).textContent =

        tipo === "PORCENTAJE"

            ? `${valor || 0}%`

            : promocionesAdmin()
                .money(
                    valor
                );

    document.querySelector(
        ".coupon-preview-icon"
    ).textContent =

        tipo === "PORCENTAJE"
            ? "%"
            : "S/";

}

function validarCupon() {

    const Admin =
        promocionesAdmin();

    const codigo =
        Admin.val(
            "coupon-code"
        );

    const tipo =
        Admin.val(
            "coupon-type"
        );

    const valor =
        Number(
            Admin.val(
                "coupon-value"
            )
        );

    const minimo =
        Number(
            Admin.val(
                "coupon-min"
            ) ||
            0
        );

    const limite =
        Admin.numeroONull(
            "coupon-limit"
        );

    const inicio =
        Admin.val(
            "coupon-start"
        );

    const fin =
        Admin.val(
            "coupon-end"
        );

    if (
        codigo.length < 3
    ) {

        Admin.setStatus(
            "El código debe tener al menos 3 caracteres.",
            "error"
        );

        return false;

    }

    if (
        !Number.isFinite(valor) ||
        valor <= 0
    ) {

        Admin.setStatus(
            "Ingresa un valor de descuento válido.",
            "error"
        );

        return false;

    }

    if (
        tipo ===
            "PORCENTAJE" &&
        valor > 100
    ) {

        Admin.setStatus(
            "El porcentaje no puede ser mayor a 100%.",
            "error"
        );

        return false;

    }

    if (
        minimo < 0
    ) {

        Admin.setStatus(
            "La compra mínima no puede ser negativa.",
            "error"
        );

        return false;

    }

    if (
        limite !== null &&
        limite < 1
    ) {

        Admin.setStatus(
            "El límite de usos debe ser mayor a 0.",
            "error"
        );

        return false;

    }

    if (
        inicio &&
        fin &&
        new Date(fin) <=
            new Date(inicio)
    ) {

        Admin.setStatus(
            "La fecha de fin debe ser posterior a la fecha de inicio.",
            "error"
        );

        return false;

    }

    return true;

}

async function guardarCupon(
    evento
) {

    evento.preventDefault();

    const Admin =
        promocionesAdmin();

    if (
        !validarCupon()
    ) {

        return;

    }

    const boton =
        document.getElementById(
            "coupon-save"
        );

    boton.disabled =
        true;

    boton.textContent =
        "Guardando...";

    try {

        Admin.setStatus(
            "Guardando cupón..."
        );

        const inicio =
            Admin.val(
                "coupon-start"
            );

        const fin =
            Admin.val(
                "coupon-end"
            );

        await Admin.rpc(
            "web_admin_guardar_cupon",
            {

                p_id:
                    Admin.numeroONull(
                        "coupon-id"
                    ),

                p_codigo:
                    Admin.val(
                        "coupon-code"
                    )
                        .toUpperCase(),

                p_descripcion:
                    Admin.val(
                        "coupon-description"
                    ),

                p_tipo:
                    Admin.val(
                        "coupon-type"
                    ),

                p_valor:
                    Number(
                        Admin.val(
                            "coupon-value"
                        )
                    ),

                p_minimo:
                    Number(
                        Admin.val(
                            "coupon-min"
                        ) ||
                        0
                    ),

                p_fecha_inicio:

                    inicio
                        ? new Date(
                            inicio
                        ).toISOString()
                        : null,

                p_fecha_fin:

                    fin
                        ? new Date(
                            fin
                        ).toISOString()
                        : null,

                p_limite:
                    Admin.numeroONull(
                        "coupon-limit"
                    ),

                p_visible:
                    document
                        .getElementById(
                            "coupon-visible"
                        )
                        .checked,

                p_activo:
                    document
                        .getElementById(
                            "coupon-active"
                        )
                        .checked

            }
        );

        Admin.setStatus(
            "Cupón guardado correctamente.",
            "success"
        );

        limpiarCupon();

        await cargarCupones();

    }

    catch (error) {

        console.error(
            "Error guardando cupón:",
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

        boton.textContent =
            "Guardar cupón";

    }

}

function configurarFiltrosCupones() {

    document.getElementById(
        "coupon-search"
    ).addEventListener(
        "input",
        evento => {

            promocionesState.busqueda =
                evento.target.value;

            renderizarCupones();

        }
    );

    document.getElementById(
        "coupon-filter"
    ).addEventListener(
        "change",
        evento => {

            promocionesState.filtro =
                evento.target.value;

            renderizarCupones();

        }
    );

}

function configurarFormularioCupon() {

    document.getElementById(
        "coupon-form"
    ).addEventListener(
        "submit",
        guardarCupon
    );

    document.getElementById(
        "coupon-new"
    ).addEventListener(
        "click",
        limpiarCupon
    );

    document.getElementById(
        "coupon-new-top"
    ).addEventListener(
        "click",
        () => {

            limpiarCupon();

            document.getElementById(
                "coupon-form"
            ).scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        }
    );

    document.getElementById(
        "coupon-cancel"
    ).addEventListener(
        "click",
        limpiarCupon
    );

    document.getElementById(
        "coupon-code"
    ).addEventListener(
        "input",
        formatearCodigoCupon
    );

    document.getElementById(
        "coupon-description"
    ).addEventListener(
        "input",
        actualizarPreviewCupon
    );

    document.getElementById(
        "coupon-value"
    ).addEventListener(
        "input",
        actualizarPreviewCupon
    );

    document.getElementById(
        "coupon-type"
    ).addEventListener(
        "change",
        actualizarTipoCupon
    );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const Admin =
            promocionesAdmin();

        if (
            !Admin ||
            !Admin.verificarAcceso()
        ) {

            return;

        }

        configurarFiltrosCupones();

        configurarFormularioCupon();

        actualizarTipoCupon();

        actualizarPreviewCupon();

        await cargarCupones();

    }
);