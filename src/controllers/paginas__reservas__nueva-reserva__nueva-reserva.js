import { fechaLima, proximosHorarios, siguientesTurnos, evaluarReserva, minutosAHora, horarioDeFecha } from '../services/horarios.js';
// Controlador original adaptado al ciclo de vida de cada ruta React.
export function setup(scope) {
    const { document, window, setTimeout } = scope;
    const { LaFondaAuth, LaFondaDB } = window;
(function () {
let enviandoReserva = false;
let horariosPublicos = null;
let horariosCargados = false;
let cerrarTarjetaHorarios = null;
function mensajeErrorReserva(error) {
    const mensaje = String(error?.message || "");
    if (/lf_crear_reserva|schema cache|PGRST202/i.test(mensaje)) return "El módulo de reservas no está habilitado en Supabase. Contacta al restaurante.";
    if (/sesión|inicia sesión|cuenta de cliente/i.test(mensaje)) return "Inicia sesión nuevamente con tu cuenta de cliente.";
    if (/ya tienes una reserva/i.test(mensaje)) return "Ya tienes una reserva activa para esa fecha y hora. Consulta Mis reservas.";
    if (/fecha y hora futuras|horario de reservas|datos obligatorios|horario|cerrado|intervalo/i.test(mensaje)) return mensaje || "Revisa los horarios disponibles (hora de Lima).";
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

function obtenerFechaLocal() { return fechaLima(); }

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

    const valor = String(email ?? "");
    const arroba = valor.indexOf("@");
    const punto = valor.lastIndexOf(".");
    return arroba > 0 && arroba === valor.lastIndexOf("@")
        && punto > arroba + 1 && punto < valor.length - 1
        && !/\s/.test(valor);

}

function telefonoReservaValido(
    telefono
) {

    return /^\d{7,15}$/
        .test(telefono);

}

function horarioReservaValido(hora, fecha) {
    return horariosCargados && evaluarReserva(horariosPublicos, fecha, hora).ok;
}

function escaparHtmlHorario(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}

function textoDia(fecha) {
    return new Intl.DateTimeFormat('es-PE', { weekday:'short', day:'numeric', timeZone:'UTC' })
      .format(new Date(`${fecha}T12:00:00Z`)).replace('.', '.');
}

function cerrarHorarios() {
    if (cerrarTarjetaHorarios) cerrarTarjetaHorarios();
}
function abrirHorarios() {
    cerrarHorarios();
    const capa = document.createElement('div');
    capa.className = 'lf-horario-overlay';
    capa.id = 'reserva-horarios-tarjeta';
    const dias = horariosCargados ? proximosHorarios(horariosPublicos) : [];
    const lista = dias.map(h => {
        if (!h) return '';
        const horario = h.cerrado ? '<span class="lf-horario-cerrado">Cerrado</span>' :
          `${minutosAHora(h.apertura)} – ${minutosAHora(h.ultima)}`;
        return `<li><span class="lf-horario-dia">${escaparHtmlHorario(textoDia(h.fecha))}${h.excepcional ? ' *' : ''}</span><span>${horario}</span></li>`;
    }).join('');
    capa.innerHTML = `<section class="lf-horario-dialogo" role="dialog" aria-modal="true" aria-labelledby="lf-titulo-horarios" tabindex="-1">
      <button type="button" class="lf-horario-cerrar" aria-label="Cerrar horarios"><i class="fa-solid fa-xmark"></i></button>
      <div class="lf-horario-icono"><i class="fa-regular fa-calendar-check"></i></div>
      <h2 id="lf-titulo-horarios">Horarios disponibles</h2>
      ${horariosCargados ? `<ul class="lf-horarios-lista">${lista}</ul>` : '<p class="lf-horario-error">No se pudieron obtener los horarios. Actualiza la página e inténtalo otra vez.</p>'}
      <p class="lf-horarios-ayuda">Los horarios indican las horas para iniciar una reserva. El límite considera 1 hora y 30 minutos antes del cierre. * Horario especial.</p>
      <button type="button" class="lf-horario-aceptar">Entendido</button></section>`;
    const botonAnterior = document.getElementById('reserva-ver-horarios');
    const cerrar = () => { capa.remove(); document.removeEventListener('keydown', alTeclado); cerrarTarjetaHorarios = null; botonAnterior?.focus(); };
    const alTeclado = evento => { if (evento.key === 'Escape') cerrar(); };
    capa.querySelector('.lf-horario-cerrar').addEventListener('click', cerrar);
    capa.querySelector('.lf-horario-aceptar').addEventListener('click', cerrar);
    capa.addEventListener('click', evento => { if (evento.target === capa) cerrar(); });
    document.addEventListener('keydown', alTeclado);
    document.body.appendChild(capa);
    cerrarTarjetaHorarios = cerrar;
    capa.querySelector('.lf-horario-cerrar').focus();
}

function actualizarTurnosReserva() {
    const fecha = document.getElementById('res-fecha').value;
    const select = document.getElementById('res-hora');
    const previo = select.value;
    const turnos = horariosCargados && fecha ? siguientesTurnos(horariosPublicos, fecha) : [];
    select.innerHTML = `<option value="">${horariosCargados ? 'Selecciona una hora' : 'Consultando horarios...'}</option>` +
        turnos.map(h => `<option value="${h}">${h}</option>`).join('');
    if (turnos.includes(previo)) select.value = previo;
    const info = document.getElementById('reserva-hora-ayuda');
    const h = fecha && horariosCargados ? horarioDeFecha(horariosPublicos, fecha) : null;
    info.textContent = !horariosCargados ? 'Cargando horarios del restaurante...' :
        !fecha ? 'Selecciona primero una fecha.' :
        !h || h.cerrado ? 'Este día está cerrado o no tiene horarios de reserva.' :
        !turnos.length ? 'Ya no hay horas futuras disponibles para esta fecha.' :
        `Horario de ${minutosAHora(h.apertura)} a ${minutosAHora(h.ultima)}; turnos cada 30 minutos.`;
}

async function cargarHorariosReserva() {
    try {
        const datos = await LaFondaDB.rpc('lf_web_horarios_v1', {});
        if (!datos || !Array.isArray(datos.dias)) throw new Error('Configuración incompleta');
        if (!scope.active) return;
        horariosPublicos = datos;
        horariosCargados = true;
        document.getElementById('reserva-horario-resumen').textContent = 'Consulta los próximos días';
    } catch (error) {
        if (!scope.active) return;
        horariosCargados = false;
        document.getElementById('reserva-horario-resumen').textContent = 'No disponible temporalmente';
        mostrarEstadoReserva('No se pudieron cargar los horarios. Revisa la conexión y vuelve a intentar.', 'error');
    }
    actualizarTurnosReserva();
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
            hora, fecha
        )
    ) {

        mostrarEstadoReserva(
            horariosCargados ? evaluarReserva(horariosPublicos, fecha, hora).mensaje : "Es necesario cargar los horarios antes de reservar.",
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
    actualizarTurnosReserva();

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
    document.getElementById('reserva-ver-horarios').addEventListener('click', abrirHorarios);
    document.getElementById('res-fecha').addEventListener('change', actualizarTurnosReserva);

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
    void cargarHorariosReserva();
}


scope.onDispose(() => cerrarHorarios());
document.addEventListener("DOMContentLoaded", iniciarPaginaReserva);

})();

}
