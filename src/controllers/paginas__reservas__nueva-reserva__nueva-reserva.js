// Controlador original adaptado al ciclo de vida de cada ruta React.
export function setup(scope) {
    const { document, window, setTimeout, clearTimeout, setInterval, clearInterval } = scope;
    const { LaFondaAuth, LaFondaDB, LaFondaStock, LaFondaImages, LaFondaEmail, LaFondaSesion, L } = window;
    const LaFondaAdmin = window.LaFondaAdmin;
(function () {
let enviandoReserva = false;
function mensajeErrorReserva(error) {
    const mensaje = String(error?.message || "");
    if (/lf_crear_reserva|schema cache|PGRST202/i.test(mensaje)) return "El módulo de reservas no está habilitado en Supabase. Contacta al restaurante.";
    if (/sesión|inicia sesión|cuenta de cliente/i.test(mensaje)) return "Inicia sesión nuevamente con tu cuenta de cliente.";
    if (/ya tienes una reserva/i.test(mensaje)) return "Ya tienes una reserva activa para esa fecha y hora. Consulta Mis reservas.";
    if (/fecha y hora futuras|horario de reservas|datos obligatorios/i.test(mensaje)) return "Revisa los datos y el horario de la reserva (12:00 a 23:00, hora de Lima).";
    return "No se pudo confirmar el registro en Supabase. Consulta Mis reservas antes de volver a enviar.";
}


function obtenerUsuarioReserva() {
    return window.LaFondaAuth?.getSession?.() || null;
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
    const partes = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(p=>[p.type,p.value]));
    return `${partes.year}-${partes.month}-${partes.day}`;
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
            `${fecha}T${hora}:00-05:00`
        );

    const ahora =
        new Date();

    return !Number.isFinite(reserva.getTime()) || reserva <= ahora;

}

async function crearNuevaReserva(
    evento
) {

    evento.preventDefault();
    if (enviandoReserva) return;

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
        nombre.length < 3 || nombre.length > 100
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
        !Number.isInteger(personas) ||
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

    if (email !== String(usuario.email || "").trim().toLowerCase()) {
        mostrarEstadoReserva("Utiliza el correo de tu cuenta para consultar la reserva después.", "error");
        return;
    }
    if (descripcion.length > 500) {
        mostrarEstadoReserva("El comentario admite hasta 500 caracteres.", "error");
        return;
    }

    enviandoReserva = true;
    const boton = document.querySelector('#reserva-form button[type="submit"]');
    if (boton) boton.disabled = true;
    try {
        const cred = LaFondaAuth.credentials("CLIENTE");
        const idReserva = await LaFondaDB.rpc("lf_crear_reserva", {
            p_email: cred.email, p_password: cred.password, p_nombre: nombre,
            p_telefono: telefono, p_fecha: fecha, p_hora: hora,
            p_personas: personas, p_descripcion: descripcion
        });
        if (!/^[1-9]\d*$/.test(String(idReserva))) throw new Error("El servidor no devolvió una confirmación válida. Consulta Mis reservas antes de reenviar.");
    } catch (error) {
        if (scope.active === false) return;
        mostrarEstadoReserva(mensajeErrorReserva(error), "error");
        enviandoReserva = false;
        if (boton) boton.disabled = false;
        return;
    }
    if (scope.active === false) return;
    mostrarEstadoReserva("Solicitud enviada al restaurante. Pendiente de asignación de mesa.", "exito");

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

function iniciarPaginaReserva() {
    if (!document.getElementById("reserva-form")) return;
    configurarFechaReserva();
    completarDatosReserva();
    configurarEventosReserva();
}


document.addEventListener("DOMContentLoaded", iniciarPaginaReserva);

})();

}
