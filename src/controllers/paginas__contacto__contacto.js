import { mensajeRPC, confirmarID, errorMensajes } from "../services/mensajes.js";
// Controlador original adaptado al ciclo de vida de cada ruta React.
export function setup(scope) {
    const { document, window } = scope;
    const { LaFondaAuth } = window;
(function () {
function contactoEmailValido(email) {
    const valor = String(email ?? "");
    const arroba = valor.indexOf("@");
    const punto = valor.lastIndexOf(".");
    return arroba > 0 && arroba === valor.lastIndexOf("@")
        && punto > arroba + 1 && punto < valor.length - 1
        && !/\s/.test(valor);
}

function mostrarEstadoContacto(mensaje, tipo = "") {
    const estado = document.getElementById("contacto-estado");
    if (!estado) return;
    estado.textContent = mensaje;
    estado.className = "contacto-estado";
    if (tipo) estado.classList.add(tipo);
}

function actualizarContadorContacto() {
    const mensaje = document.getElementById("contacto-mensaje");
    const contador = document.getElementById("contacto-contador");
    if (mensaje && contador) contador.textContent = mensaje.value.length;
}

function completarDatosContacto() {
    const sesion = window.LaFondaAuth?.getSession?.();
    if (!sesion) return;

    const nombre = document.getElementById("contacto-nombre");
    const email = document.getElementById("contacto-email");

    if (nombre) {
        nombre.value = [sesion.nombre || "", sesion.apellido || ""]
            .join(" ")
            .trim();
    }

    if (email) email.value = sesion.email || "";
    if (nombre && sesion.rol === "CLIENTE") nombre.readOnly = true;
    if (email && sesion.rol === "CLIENTE") email.readOnly = true;
}

let enviando = false;
let solicitud = null;
let contenido = null;
async function enviarContacto(evento) {
    evento.preventDefault();
    if (enviando) return;
    const sesion = LaFondaAuth?.getSession();
    if (!sesion) { LaFondaAuth?.requireLogin("/paginas/contacto/"); return; }
    if (sesion.rol !== "CLIENTE") { mostrarEstadoContacto("Inicia sesión con una cuenta de cliente para enviar un mensaje.", "error"); return; }

    const nombre = document.getElementById("contacto-nombre").value.trim();
    const email = document.getElementById("contacto-email").value.trim();
    const tipo = document.getElementById("contacto-tipo").value;
    const mensaje = document.getElementById("contacto-mensaje").value.trim();

    if (!nombre || !email || !tipo || !mensaje) {
        mostrarEstadoContacto("Completa todos los campos obligatorios.", "error");
        return;
    }

    if (!contactoEmailValido(email)) {
        mostrarEstadoContacto("Ingresa un correo electrónico válido.", "error");
        return;
    }

    if (nombre.length < 3) {
        mostrarEstadoContacto("Ingresa tu nombre completo.", "error");
        return;
    }

    if (mensaje.length < 10 || mensaje.length > 800) {
        mostrarEstadoContacto("Escribe un mensaje de entre 10 y 800 caracteres.", "error");
        return;
    }

    const boton = document.getElementById("contacto-enviar");
    const form = document.getElementById("contacto-formulario");
    if (!['consulta','sugerencia','queja','felicitacion'].includes(tipo)) { mostrarEstadoContacto('Selecciona un tipo válido.', 'error'); return; }
    const clave = JSON.stringify([tipo,mensaje]);
    if (!solicitud || contenido !== clave) { solicitud = crypto.randomUUID(); contenido = clave; }
    enviando = true;
    const controles = [...form.querySelectorAll('input,select,textarea,button')];
    controles.forEach(c => c.disabled = true);
    boton.textContent = "Enviando...";
    mostrarEstadoContacto("Enviando mensaje...");
    try {
        confirmarID(await mensajeRPC('CLIENTE','lf_contacto_enviar',{p_solicitud:solicitud,p_tipo:tipo,p_mensaje:mensaje}));
        if (!scope.active) return;
        form.reset(); completarDatosContacto(); actualizarContadorContacto();
        solicitud = null; contenido = null;
        mostrarEstadoContacto("Mensaje enviado. Recibirás la respuesta en Notificaciones.", "exito");
    } catch (error) { if (scope.active) mostrarEstadoContacto(errorMensajes(error), "error"); }
    finally { enviando = false; if (scope.active) { controles.forEach(c => c.disabled = false); boton.textContent = "Enviar mensaje"; } }

}

function configurarEventosContacto() {
    const formulario = document.getElementById("contacto-formulario");
    const mensaje = document.getElementById("contacto-mensaje");

    formulario?.addEventListener("submit", enviarContacto);
    mensaje?.addEventListener("input", actualizarContadorContacto);
}

function iniciarPaginaContacto() {
    completarDatosContacto();
    if (!LaFondaAuth?.getSession()) mostrarEstadoContacto("Inicia sesión para enviar un mensaje y recibir la respuesta en Notificaciones.");
    actualizarContadorContacto();
    configurarEventosContacto();
}


document.addEventListener("DOMContentLoaded", iniciarPaginaContacto);

})();

}
