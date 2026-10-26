let correoRecuperacion = "";
let tokenRecuperacion = null;
let ultimoEnvioRecuperacion = 0;
let enviandoRecuperacion = false;

function estadoRecuperacion(id, texto, tipo = "") {
    const elemento = document.getElementById(id);
    elemento.textContent = texto;
    elemento.className = "registro-estado";
    if (tipo) elemento.classList.add(tipo);
}

function pantallaRecuperacion(pantalla) {
    const pantallas = {
        email: "recuperar-correo-form",
        codigo: "recuperar-paso-codigo",
        password: "recuperar-password-form",
        final: "recuperar-finalizado"
    };
    for (const [nombre, id] of Object.entries(pantallas)) {
        document.getElementById(id).hidden = nombre !== pantalla;
    }
}

function actualizarReenvioRecuperacion() {
    const boton = document.getElementById("recuperar-reenviar");
    const restantes = Math.max(0, Math.ceil((ultimoEnvioRecuperacion + 60000 - Date.now()) / 1000));
    boton.disabled = restantes > 0 || enviandoRecuperacion;
    boton.textContent = restantes ? `Reenviar en ${restantes} s` : "Reenviar código";
}

async function enviarCodigoRecuperacion(evento) {
    evento.preventDefault();
    const correo = document.getElementById("recuperar-email").value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(correo) || correo.length > 150) {
        estadoRecuperacion("recuperar-correo-estado", "Introduce un correo electrónico válido.", "error");
        return;
    }
    const boton = document.getElementById("recuperar-enviar");
    boton.disabled = true;
    estadoRecuperacion("recuperar-correo-estado", "Solicitando código...");
    try {
        await LaFondaEmail.enviarCodigo(correo);
        correoRecuperacion = correo;
        tokenRecuperacion = null;
        ultimoEnvioRecuperacion = Date.now();
        document.getElementById("recuperar-destino").textContent = correo;
        document.getElementById("recuperar-codigo").value = "";
        pantallaRecuperacion("codigo");
        estadoRecuperacion("recuperar-codigo-estado", "Revisa tu correo, incluida la carpeta de spam.");
        actualizarReenvioRecuperacion();
        document.getElementById("recuperar-codigo").focus();
    } catch (error) {
        estadoRecuperacion("recuperar-correo-estado", error.message || "No se pudo enviar el código.", "error");
    } finally {
        boton.disabled = false;
    }
}

async function verificarCodigoRecuperacion(evento) {
    evento.preventDefault();
    const boton = document.getElementById("recuperar-verificar");
    boton.disabled = true;
    estadoRecuperacion("recuperar-codigo-estado", "Verificando código...");
    try {
        tokenRecuperacion = await LaFondaEmail.verificarCodigo(
            correoRecuperacion,
            document.getElementById("recuperar-codigo").value.trim()
        );
        pantallaRecuperacion("password");
        document.getElementById("recuperar-password").focus();
    } catch (error) {
        estadoRecuperacion("recuperar-codigo-estado", error.message || "Código inválido.", "error");
    } finally {
        boton.disabled = false;
    }
}

function contraseñaRecuperacionValida(password) {
    return password.length >= 8 && password.length <= 72 &&
        /[A-Z]/.test(password) && /[a-z]/.test(password) &&
        /[0-9]/.test(password) && /[^A-Za-z0-9\s]/.test(password);
}

async function guardarContrasenaRecuperacion(evento) {
    evento.preventDefault();
    const password = document.getElementById("recuperar-password").value;
    const confirmacion = document.getElementById("recuperar-password2").value;
    if (!contraseñaRecuperacionValida(password)) {
        estadoRecuperacion("recuperar-password-estado", "La contraseña debe tener entre 8 y 72 caracteres, mayúscula, minúscula, número y símbolo.", "error");
        return;
    }
    if (password !== confirmacion) {
        estadoRecuperacion("recuperar-password-estado", "Las contraseñas no coinciden.", "error");
        return;
    }
    const boton = document.getElementById("recuperar-guardar");
    boton.disabled = true;
    estadoRecuperacion("recuperar-password-estado", "Guardando contraseña...");
    try {
        await LaFondaAuth.resetPasswordVerified(correoRecuperacion, password, tokenRecuperacion);
        document.getElementById("recuperar-password").value = "";
        document.getElementById("recuperar-password2").value = "";
        tokenRecuperacion = null;
        pantallaRecuperacion("final");
    } catch (error) {
        estadoRecuperacion("recuperar-password-estado", error.message || "No se pudo restablecer la contraseña.", "error");
    } finally {
        boton.disabled = false;
    }
}

async function reenviarCodigoRecuperacion() {
    if (!correoRecuperacion || enviandoRecuperacion || Date.now() < ultimoEnvioRecuperacion + 60000) return;
    enviandoRecuperacion = true;
    actualizarReenvioRecuperacion();
    try {
        await LaFondaEmail.enviarCodigo(correoRecuperacion);
        ultimoEnvioRecuperacion = Date.now();
        estadoRecuperacion("recuperar-codigo-estado", "Enviamos un código nuevo.", "exito");
    } catch (error) {
        estadoRecuperacion("recuperar-codigo-estado", error.message || "No se pudo reenviar el código.", "error");
    } finally {
        enviandoRecuperacion = false;
        actualizarReenvioRecuperacion();
    }
}

function configurarVisibilidadRecuperacion(inputId, botonId) {
    const input = document.getElementById(inputId);
    const boton = document.getElementById(botonId);
    boton.addEventListener("click", () => {
        const mostrar = input.type === "password";
        input.type = mostrar ? "text" : "password";
        boton.textContent = mostrar ? "Ocultar" : "Mostrar";
        boton.setAttribute("aria-pressed", String(mostrar));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("recuperar-correo-form").addEventListener("submit", enviarCodigoRecuperacion);
    document.getElementById("recuperar-codigo-form").addEventListener("submit", verificarCodigoRecuperacion);
    document.getElementById("recuperar-password-form").addEventListener("submit", guardarContrasenaRecuperacion);
    document.getElementById("recuperar-reenviar").addEventListener("click", reenviarCodigoRecuperacion);
    document.getElementById("recuperar-cambiar").addEventListener("click", () => {
        tokenRecuperacion = null;
        correoRecuperacion = "";
        document.getElementById("recuperar-codigo").value = "";
        pantallaRecuperacion("email");
        document.getElementById("recuperar-email").focus();
    });
    document.getElementById("recuperar-codigo").addEventListener("input", evento => {
        evento.target.value = evento.target.value.replace(/\D/g, "").slice(0, 6);
    });
    configurarVisibilidadRecuperacion("recuperar-password", "recuperar-ver-password");
    configurarVisibilidadRecuperacion("recuperar-password2", "recuperar-ver-password2");
    setInterval(actualizarReenvioRecuperacion, 1000);
});
