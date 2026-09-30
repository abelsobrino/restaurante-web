const configuracionState = {

    delivery: null,

    mapa: null,

    marcador: null

};

function configuracionAdmin() {

    return window.LaFondaAdmin;

}

function configMoney(valor) {

    return `S/ ${Number(
        valor || 0
    ).toFixed(2)}`;

}

async function cargarDelivery() {

    const Admin =
        configuracionAdmin();

    try {

        Admin.setStatus(
            "Cargando configuración..."
        );

        const datos =
            await Admin.rpc(
                "web_admin_delivery"
            );

        configuracionState.delivery =
            datos || {};

        document.getElementById(
            "delivery-active"
        ).checked =
            Boolean(
                datos?.activo
            );

        document.getElementById(
            "delivery-lat"
        ).value =
            datos?.latitud ??
            "";

        document.getElementById(
            "delivery-lng"
        ).value =
            datos?.longitud ??
            "";

        document.getElementById(
            "delivery-price"
        ).value =
            datos?.precio_km ??
            2.5;

        document.getElementById(
            "delivery-min"
        ).value =
            datos?.tarifa_minima ??
            5;

        document.getElementById(
            "delivery-radius"
        ).value =
            datos?.radio_maximo_km ??
            15;

        actualizarResumenDelivery();

        actualizarMapaDesdeFormulario(
            false
        );

        actualizarEjemploDelivery();

        Admin.setStatus("");

    }

    catch (error) {

        console.error(
            "Error cargando delivery:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

function actualizarResumenDelivery() {

    const activo =
        document.getElementById(
            "delivery-active"
        ).checked;

    const precio =
        Number(
            document.getElementById(
                "delivery-price"
            ).value ||
            0
        );

    const minimo =
        Number(
            document.getElementById(
                "delivery-min"
            ).value ||
            0
        );

    const radio =
        Number(
            document.getElementById(
                "delivery-radius"
            ).value ||
            0
        );

    const estado =
        document.getElementById(
            "summary-status"
        );

    estado.textContent =
        activo
            ? "Activo"
            : "Inactivo";

    estado.className =
        activo
            ? "enabled"
            : "disabled";

    document.getElementById(
        "summary-price"
    ).textContent =
        configMoney(
            precio
        );

    document.getElementById(
        "summary-min"
    ).textContent =
        configMoney(
            minimo
        );

    document.getElementById(
        "summary-radius"
    ).textContent =
        `${radio.toFixed(1)} km`;

    document.getElementById(
        "delivery-summary"
    ).hidden =
        false;

}

function inicializarMapa() {

    if (!window.L) {

        return;

    }

    const centroInicial = [
        -12.0464,
        -77.0428
    ];

    configuracionState.mapa =
        L.map(
            "admin-delivery-map"
        ).setView(
            centroInicial,
            11
        );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom:
                19,

            attribution:
                "© OpenStreetMap"

        }
    ).addTo(
        configuracionState.mapa
    );

    configuracionState.marcador =
        L.marker(
            centroInicial,
            {
                draggable:
                    true
            }
        ).addTo(
            configuracionState.mapa
        );

    configuracionState.mapa.on(
        "click",
        evento => {

            colocarMarcador(
                evento.latlng.lat,
                evento.latlng.lng,
                true
            );

        }
    );

    configuracionState
        .marcador
        .on(
            "dragend",
            () => {

                const posicion =
                    configuracionState
                        .marcador
                        .getLatLng();

                colocarMarcador(
                    posicion.lat,
                    posicion.lng,
                    true
                );

            }
        );

}

function colocarMarcador(
    latitud,
    longitud,
    actualizarInputs = true
) {

    if (
        !Number.isFinite(
            latitud
        ) ||
        !Number.isFinite(
            longitud
        )
    ) {

        return;

    }

    configuracionState
        .marcador
        ?.setLatLng(
            [
                latitud,
                longitud
            ]
        );

    configuracionState
        .mapa
        ?.setView(
            [
                latitud,
                longitud
            ],
            16
        );

    if (
        actualizarInputs
    ) {

        document.getElementById(
            "delivery-lat"
        ).value =
            latitud.toFixed(
                6
            );

        document.getElementById(
            "delivery-lng"
        ).value =
            longitud.toFixed(
                6
            );

    }

    document.getElementById(
        "map-lat"
    ).textContent =
        latitud.toFixed(
            6
        );

    document.getElementById(
        "map-lng"
    ).textContent =
        longitud.toFixed(
            6
        );

}

function actualizarMapaDesdeFormulario(
    mostrarError = true
) {

    const Admin =
        configuracionAdmin();

    const latitud =
        Number(
            document.getElementById(
                "delivery-lat"
            ).value
        );

    const longitud =
        Number(
            document.getElementById(
                "delivery-lng"
            ).value
        );

    if (
        !Number.isFinite(
            latitud
        ) ||
        !Number.isFinite(
            longitud
        )
    ) {

        if (
            mostrarError
        ) {

            Admin.setStatus(
                "Ingresa una latitud y longitud válidas.",
                "error"
            );

        }

        return false;

    }

    if (
        latitud < -90 ||
        latitud > 90
    ) {

        if (
            mostrarError
        ) {

            Admin.setStatus(
                "La latitud debe estar entre -90 y 90.",
                "error"
            );

        }

        return false;

    }

    if (
        longitud < -180 ||
        longitud > 180
    ) {

        if (
            mostrarError
        ) {

            Admin.setStatus(
                "La longitud debe estar entre -180 y 180.",
                "error"
            );

        }

        return false;

    }

    colocarMarcador(
        latitud,
        longitud,
        false
    );

    if (
        mostrarError
    ) {

        Admin.setStatus("");

    }

    return true;

}

function actualizarEjemploDelivery() {

    const precioKm =
        Number(
            document.getElementById(
                "delivery-price"
            ).value ||
            0
        );

    const tarifaMinima =
        Number(
            document.getElementById(
                "delivery-min"
            ).value ||
            0
        );

    const distancia =
        Number(
            document.getElementById(
                "delivery-example-distance"
            ).value ||
            0
        );

    const tarifa =
        Math.max(
            tarifaMinima,
            distancia *
            precioKm
        );

    document.getElementById(
        "delivery-example-price"
    ).textContent =
        configMoney(
            tarifa
        );

}

function validarConfiguracionDelivery() {

    const Admin =
        configuracionAdmin();

    const latitud =
        Admin.numeroONull(
            "delivery-lat"
        );

    const longitud =
        Admin.numeroONull(
            "delivery-lng"
        );

    const precio =
        Number(
            Admin.val(
                "delivery-price"
            )
        );

    const minimo =
        Number(
            Admin.val(
                "delivery-min"
            )
        );

    const radio =
        Number(
            Admin.val(
                "delivery-radius"
            )
        );

    if (
        latitud === null ||
        longitud === null
    ) {

        Admin.setStatus(
            "Configura las coordenadas del restaurante.",
            "error"
        );

        return false;

    }

    if (
        latitud < -90 ||
        latitud > 90
    ) {

        Admin.setStatus(
            "La latitud no es válida.",
            "error"
        );

        return false;

    }

    if (
        longitud < -180 ||
        longitud > 180
    ) {

        Admin.setStatus(
            "La longitud no es válida.",
            "error"
        );

        return false;

    }

    if (
        !Number.isFinite(
            precio
        ) ||
        precio < 0
    ) {

        Admin.setStatus(
            "El precio por kilómetro no es válido.",
            "error"
        );

        return false;

    }

    if (
        !Number.isFinite(
            minimo
        ) ||
        minimo < 0
    ) {

        Admin.setStatus(
            "La tarifa mínima no es válida.",
            "error"
        );

        return false;

    }

    if (
        !Number.isFinite(
            radio
        ) ||
        radio <= 0
    ) {

        Admin.setStatus(
            "El radio máximo debe ser mayor a 0.",
            "error"
        );

        return false;

    }

    return true;

}

async function guardarDelivery(
    evento
) {

    evento.preventDefault();

    const Admin =
        configuracionAdmin();

    if (
        !validarConfiguracionDelivery()
    ) {

        return;

    }

    const boton =
        document.getElementById(
            "delivery-save"
        );

    boton.disabled =
        true;

    boton.textContent =
        "Guardando...";

    try {

        Admin.setStatus(
            "Guardando configuración..."
        );

        await Admin.rpc(
            "web_admin_guardar_delivery",
            {

                p_activo:
                    document
                        .getElementById(
                            "delivery-active"
                        )
                        .checked,

                p_latitud:
                    Admin.numeroONull(
                        "delivery-lat"
                    ),

                p_longitud:
                    Admin.numeroONull(
                        "delivery-lng"
                    ),

                p_precio_km:
                    Number(
                        Admin.val(
                            "delivery-price"
                        )
                    ),

                p_tarifa_minima:
                    Number(
                        Admin.val(
                            "delivery-min"
                        )
                    ),

                p_radio:
                    Number(
                        Admin.val(
                            "delivery-radius"
                        )
                    )

            }
        );

        Admin.setStatus(
            "Configuración de delivery guardada correctamente.",
            "success"
        );

        await cargarDelivery();

    }

    catch (error) {

        console.error(
            "Error guardando delivery:",
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
            "Guardar configuración";

    }

}

function configurarEventosDelivery() {

    document.getElementById(
        "delivery-form"
    ).addEventListener(
        "submit",
        guardarDelivery
    );

    document.getElementById(
        "delivery-center-map"
    ).addEventListener(
        "click",
        () => {

            actualizarMapaDesdeFormulario(
                true
            );

        }
    );

    [
        "delivery-active",
        "delivery-price",
        "delivery-min",
        "delivery-radius"
    ]
        .forEach(
            id => {

                document
                    .getElementById(id)
                    .addEventListener(
                        "input",
                        () => {

                            actualizarResumenDelivery();

                            actualizarEjemploDelivery();

                        }
                    );

                document
                    .getElementById(id)
                    .addEventListener(
                        "change",
                        () => {

                            actualizarResumenDelivery();

                            actualizarEjemploDelivery();

                        }
                    );

            }
        );

    document.getElementById(
        "delivery-example-distance"
    ).addEventListener(
        "input",
        actualizarEjemploDelivery
    );

    [
        "delivery-lat",
        "delivery-lng"
    ]
        .forEach(
            id => {

                document
                    .getElementById(id)
                    .addEventListener(
                        "change",
                        () => {

                            actualizarMapaDesdeFormulario(
                                false
                            );

                        }
                    );

            }
        );

}

const HORARIO_DIAS = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo"
};

async function cargarHorario() {

    const Admin =
        configuracionAdmin();

    try {

        const datos =
            await Admin.rpc(
                "web_admin_horario"
            );

        document.getElementById(
            "horario-activo"
        ).checked =
            Boolean(
                datos?.activo
            );

        const dias =
            Array.isArray(
                datos?.dias
            ) &&
            datos.dias.length

                ? datos.dias

                : Object.keys(
                    HORARIO_DIAS
                ).map(
                    dia => ({

                        dia_semana:
                            Number(dia),

                        hora_apertura:
                            "11:00",

                        hora_cierre:
                            "22:00",

                        cerrado:
                            false

                    })
                );

        document.getElementById(
            "horario-dias-body"
        ).innerHTML =
            dias
                .map(
                    item => `

                        <tr
                            data-dia="${Number(
                                item.dia_semana
                            )}"
                        >

                            <td>
                                ${HORARIO_DIAS[
                                    Number(
                                        item.dia_semana
                                    )
                                ] || "Día"}
                            </td>

                            <td>
                                <input
                                    type="time"
                                    class="horario-apertura"
                                    value="${String(
                                        item.hora_apertura ||
                                        "11:00"
                                    ).slice(0, 5)}"
                                >
                            </td>

                            <td>
                                <input
                                    type="time"
                                    class="horario-cierre"
                                    value="${String(
                                        item.hora_cierre ||
                                        "22:00"
                                    ).slice(0, 5)}"
                                >
                            </td>

                            <td>
                                <input
                                    type="checkbox"
                                    class="horario-cerrado"
                                    ${item.cerrado
                                        ? "checked"
                                        : ""}
                                >
                            </td>

                        </tr>

                    `
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Error cargando horario:",
            error
        );

        Admin.setStatus(
            error.message,
            "error"
        );

    }

}

async function guardarHorario(
    evento
) {

    evento.preventDefault();

    const Admin =
        configuracionAdmin();

    const boton =
        document.getElementById(
            "horario-save"
        );

    const dias =
        [
            ...document.querySelectorAll(
                "#horario-dias-body tr"
            )
        ].map(
            fila => ({

                dia_semana:
                    Number(
                        fila.dataset.dia
                    ),

                hora_apertura:
                    fila.querySelector(
                        ".horario-apertura"
                    ).value ||
                    "11:00",

                hora_cierre:
                    fila.querySelector(
                        ".horario-cierre"
                    ).value ||
                    "22:00",

                cerrado:
                    fila.querySelector(
                        ".horario-cerrado"
                    ).checked

            })
        );

    boton.disabled =
        true;

    boton.textContent =
        "Guardando...";

    try {

        await Admin.rpc(
            "web_admin_guardar_horario",
            {

                p_activo:
                    document.getElementById(
                        "horario-activo"
                    ).checked,

                p_dias:
                    dias

            }
        );

        Admin.setStatus(
            "Horario guardado correctamente.",
            "success"
        );

        await cargarHorario();

    }

    catch (error) {

        console.error(
            "Error guardando horario:",
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
            "Guardar horario";

    }

}

function configurarEventosHorario() {

    document.getElementById(
        "horario-form"
    ).addEventListener(
        "submit",
        guardarHorario
    );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const Admin =
            configuracionAdmin();

        if (
            !Admin ||
            !Admin.verificarAcceso()
        ) {

            return;

        }

        inicializarMapa();

        configurarEventosDelivery();

        configurarEventosHorario();

        await Promise.all([
            cargarDelivery(),
            cargarHorario()
        ]);

        setTimeout(
            () => {

                configuracionState
                    .mapa
                    ?.invalidateSize();

            },
            200
        );

    }
);