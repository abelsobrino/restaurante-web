const RESERVAS_KEY =
    "la_fonda_reservas";

function cargarReservasGuardadas() {

    try {

        const datos =
            localStorage.getItem(
                RESERVAS_KEY
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
            "Error cargando reservas:",
            error
        );

        return [];

    }

}

function guardarReservas(
    reservas
) {

    localStorage.setItem(
        RESERVAS_KEY,
        JSON.stringify(reservas)
    );

}

function obtenerUsuarioReserva() {

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

function mostrarEstadoReserva(
    mensaje,
    tipo = ""
) {

    const estado =
        document.getElementById(
            "reserva-estado"
        );

    estado.textContent =
        mensaje;

    estado.className =
        "reserva-estado";

    if (tipo) {

        estado.classList.add(
            tipo
        );

    }

}

function obtenerFechaLocal() {

    const hoy =
        new Date();

    const anio =
        hoy.getFullYear();

    const mes =
        String(
            hoy.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            hoy.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${anio}-${mes}-${dia}`;

}

function configurarFechaReserva() {

    const input =
        document.getElementById(
            "res-fecha"
        );

    input.min =
        obtenerFechaLocal();

}

function completarDatosReserva() {

    const usuario =
        obtenerUsuarioReserva();

    if (!usuario) {
        return;
    }

    const nombre = [

        usuario.nombre || "",
        usuario.apellido || ""

    ]
        .join(" ")
        .trim();

    const inputNombre =
        document.getElementById(
            "res-nombre"
        );

    const inputEmail =
        document.getElementById(
            "res-email"
        );

    const inputTelefono =
        document.getElementById(
            "res-telefono"
        );

    if (nombre) {

        inputNombre.value =
            nombre;

    }

    if (usuario.email) {

        inputEmail.value =
            usuario.email;

    }

    if (usuario.telefono) {

        inputTelefono.value =
            usuario.telefono;

    }

}

function emailReservaValido(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}

function telefonoReservaValido(
    telefono
) {

    return /^\d{7,15}$/
        .test(telefono);

}

function horarioReservaValido(
    hora
) {

    if (!hora) {
        return false;
    }

    const [
        horas,
        minutos
    ] =
        hora
            .split(":")
            .map(Number);

    const totalMinutos =
        horas * 60 +
        minutos;

    const apertura =
        12 * 60;

    const cierre =
        23 * 60;

    return (
        totalMinutos >= apertura &&
        totalMinutos <= cierre
    );

}

function reservaEsPasada(
    fecha,
    hora
) {

    const reserva =
        new Date(
            `${fecha}T${hora}:00`
        );

    const ahora =
        new Date();

    return reserva <= ahora;

}

function existeReservaDuplicada(
    reservas,
    fecha,
    hora
) {

    return reservas.some(
        reserva =>
            reserva.fecha === fecha &&
            reserva.hora === hora
    );

}

function crearIdReserva() {

    if (
        window.crypto &&
        typeof crypto.randomUUID ===
            "function"
    ) {

        return crypto.randomUUID();

    }

    return (
        Date.now().toString() +
        "-" +
        Math.random()
            .toString(16)
            .slice(2)
    );

}

function crearNuevaReserva(
    evento
) {

    evento.preventDefault();

    const usuario =
        obtenerUsuarioReserva();

    if (!usuario) {

        sessionStorage.setItem(
            "lafonda_return_to",
            window.location.pathname
        );

        mostrarEstadoReserva(
            "Debes iniciar sesión para reservar.",
            "error"
        );

        setTimeout(
            () => {

                window.location.href =
                    "/paginas/acceso/iniciar-sesion/";

            },
            600
        );

        return;

    }

    const nombre =
        document
            .getElementById(
                "res-nombre"
            )
            .value
            .trim();

    const email =
        document
            .getElementById(
                "res-email"
            )
            .value
            .trim()
            .toLowerCase();

    const telefono =
        document
            .getElementById(
                "res-telefono"
            )
            .value
            .replace(/\D/g, "");

    const fecha =
        document.getElementById(
            "res-fecha"
        ).value;

    const hora =
        document.getElementById(
            "res-hora"
        ).value;

    const personas =
        Number(
            document.getElementById(
                "res-sillas"
            ).value
        );

    const descripcion =
        document
            .getElementById(
                "res-descripcion"
            )
            .value
            .trim();

    if (
        !nombre ||
        !email ||
        !telefono ||
        !fecha ||
        !hora ||
        !personas
    ) {

        mostrarEstadoReserva(
            "Completa todos los campos obligatorios.",
            "error"
        );

        return;

    }

    if (
        nombre.length < 3
    ) {

        mostrarEstadoReserva(
            "Ingresa tu nombre completo.",
            "error"
        );

        return;

    }

    if (
        !emailReservaValido(
            email
        )
    ) {

        mostrarEstadoReserva(
            "Ingresa un correo electrónico válido.",
            "error"
        );

        return;

    }

    if (
        !telefonoReservaValido(
            telefono
        )
    ) {

        mostrarEstadoReserva(
            "Ingresa un teléfono válido.",
            "error"
        );

        return;

    }

    if (
        personas < 1 ||
        personas > 20
    ) {

        mostrarEstadoReserva(
            "La reserva debe ser para entre 1 y 20 personas.",
            "error"
        );

        return;

    }

    if (
        !horarioReservaValido(
            hora
        )
    ) {

        mostrarEstadoReserva(
            "Nuestro horario de reservas es de 12:00 PM a 11:00 PM.",
            "error"
        );

        return;

    }

    if (
        reservaEsPasada(
            fecha,
            hora
        )
    ) {

        mostrarEstadoReserva(
            "Selecciona una fecha y hora futuras.",
            "error"
        );

        return;

    }

    const reservas =
        cargarReservasGuardadas();

    if (
        existeReservaDuplicada(
            reservas,
            fecha,
            hora
        )
    ) {

        mostrarEstadoReserva(
            "Ya existe una reserva para esa fecha y hora. Elige otro horario.",
            "error"
        );

        return;

    }

    const nuevaReserva = {

        id:
            crearIdReserva(),

        nombre,

        email,

        telefono,

        fecha,

        hora,

        sillas:
            personas,

        descripcion:
            descripcion ||
            "Sin comentarios",

        estado:
            "ACTIVA",

        fechaCreacion:
            new Date()
                .toISOString()

    };

    reservas.push(
        nuevaReserva
    );

    guardarReservas(
        reservas
    );

    mostrarEstadoReserva(
        "¡Reserva creada correctamente! Te esperamos.",
        "exito"
    );

    document
        .getElementById(
            "reserva-form"
        )
        .reset();

    configurarFechaReserva();

    completarDatosReserva();

    document.getElementById(
        "res-sillas"
    ).value =
        "2";

    document.getElementById(
        "res-contador"
    ).textContent =
        "0";

    setTimeout(
        () => {

            window.location.href =
                "/paginas/reservas/mis-reservas/";

        },
        900
    );

}

function actualizarContadorReserva() {

    const textarea =
        document.getElementById(
            "res-descripcion"
        );

    document.getElementById(
        "res-contador"
    ).textContent =
        textarea.value.length;

}

function limitarTelefonoReserva() {

    const input =
        document.getElementById(
            "res-telefono"
        );

    input.value =
        input.value
            .replace(/\D/g, "")
            .slice(0, 15);

}

function configurarEventosReserva() {

    document.getElementById(
        "reserva-form"
    ).addEventListener(
        "submit",
        crearNuevaReserva
    );

    document.getElementById(
        "res-descripcion"
    ).addEventListener(
        "input",
        actualizarContadorReserva
    );

    document.getElementById(
        "res-telefono"
    ).addEventListener(
        "input",
        limitarTelefonoReserva
    );

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarFechaReserva();

        completarDatosReserva();

        configurarEventosReserva();

    }
);