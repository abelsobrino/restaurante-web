function contactoEmailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
}

function cambiarTabContacto(id) {
    document.querySelectorAll(".contacto-tab").forEach((boton) => {
        const activo = boton.dataset.tab === id;
        boton.classList.toggle("active", activo);
        boton.setAttribute("aria-selected", String(activo));
    });

    document.querySelectorAll(".contacto-tab-panel").forEach((panel) => {
        const activo = panel.id === id;
        panel.classList.toggle("active", activo);
        panel.hidden = !activo;
    });
}

function configurarTabsContacto() {
    document.querySelectorAll(".contacto-tab").forEach((boton) => {
        boton.addEventListener("click", () => cambiarTabContacto(boton.dataset.tab));
    });
}

function enviarContacto(evento) {
    evento.preventDefault();

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

    if (mensaje.length < 10) {
        mostrarEstadoContacto("Escribe un mensaje un poco más detallado.", "error");
        return;
    }

    const boton = document.getElementById("contacto-enviar");
    boton.disabled = true;
    boton.textContent = "Enviando...";
    mostrarEstadoContacto("Enviando mensaje...");

    setTimeout(() => {
        document.getElementById("contacto-formulario").reset();
        document.getElementById("contacto-contador").textContent = "0";
        completarDatosContacto();
        mostrarEstadoContacto("Mensaje enviado con éxito. Te responderemos a la brevedad.", "exito");
        boton.disabled = false;
        boton.textContent = "Enviar comentario";
    }, 500);
}

function configurarEventosContacto() {
    const formulario = document.getElementById("contacto-formulario");
    const mensaje = document.getElementById("contacto-mensaje");

    formulario?.addEventListener("submit", enviarContacto);
    mensaje?.addEventListener("input", actualizarContadorContacto);
}

document.addEventListener("DOMContentLoaded", () => {
    completarDatosContacto();
    configurarTabsContacto();
    configurarEventosContacto();
});
