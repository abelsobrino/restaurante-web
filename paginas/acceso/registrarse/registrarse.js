function mostrarEstadoRegistro(mensaje, tipo = "") {
    const estado = document.getElementById("register-status");
    estado.textContent = mensaje;
    estado.className = "registro-estado";
    if (tipo) estado.classList.add(tipo);
}

const camposRegistro = [
    "reg-nombre",
    "reg-apellido",
    "reg-email",
    "reg-telefono",
    "reg-password",
    "reg-password2"
];

const reglasPassword = [
    { id: "longitud", cumple: valor => valor.length >= 8 && valor.length <= 72 },
    { id: "mayuscula", cumple: valor => /[A-Z]/.test(valor) },
    { id: "minuscula", cumple: valor => /[a-z]/.test(valor) },
    { id: "numero", cumple: valor => /[0-9]/.test(valor) },
    { id: "simbolo", cumple: valor => /[^A-Za-z0-9\s]/.test(valor) }
];

function valorRegistro(id) {
    return document.getElementById(id).value;
}

function normalizarNombre(valor) {
    return valor.trim().replace(/\s+/g, " ");
}

function errorRegistro(id) {
    const valor = valorRegistro(id);
    const nombreValido = /^[\p{L}]+(?:[ '\-’][\p{L}]+)*$/u;

    if (id === "reg-nombre" || id === "reg-apellido") {
        const nombre = normalizarNombre(valor);
        if (!nombre) return "Este campo es obligatorio.";
        if (nombre.length < 2 || nombre.length > 60 || !nombreValido.test(nombre)) {
            return "Usa entre 2 y 60 caracteres; solo letras, espacios, guiones o apóstrofes.";
        }
    }

    if (id === "reg-email") {
        const email = valor.trim().toLowerCase();
        if (!email) return "Ingresa tu correo electrónico.";
        if (email.length > 150 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) || email.includes("..")) {
            return "Escribe un correo válido, por ejemplo: nombre@correo.com.";
        }
    }

    if (id === "reg-telefono") {
        if (!/^9[0-9]{8}$/.test(valor)) {
            return "Ingresa un celular peruano de 9 dígitos que empiece con 9.";
        }
    }

    if (id === "reg-password") {
        if (!reglasPassword.every(regla => regla.cumple(valor))) {
            return "La contraseña debe cumplir todos los requisitos indicados.";
        }
    }

    if (id === "reg-password2") {
        if (!valor) return "Confirma tu contraseña.";
        if (valor !== valorRegistro("reg-password")) return "Las contraseñas no coinciden.";
    }

    return "";
}

function actualizarCampoRegistro(id, mostrarError = true) {
    const input = document.getElementById(id);
    const mensaje = document.getElementById(`${id}-error`);
    const error = errorRegistro(id);
    const visible = mostrarError && Boolean(error);

    mensaje.textContent = visible ? error : "";
    input.classList.toggle("campo-invalido", visible);
    input.setAttribute("aria-invalid", String(visible));
    return !error;
}

function actualizarReglasPassword() {
    const password = valorRegistro("reg-password");
    let aprobadas = 0;

    for (const regla of reglasPassword) {
        const correcto = regla.cumple(password);
        const elemento = document.getElementById(`regla-${regla.id}`);
        elemento.classList.toggle("cumple", correcto);
        aprobadas += Number(correcto);
    }

    const barra = document.getElementById("registro-password-progreso");
    barra.style.width = `${aprobadas * 20}%`;
    barra.dataset.nivel = aprobadas < 3 ? "bajo" : aprobadas < 5 ? "medio" : "alto";

    document.getElementById("registro-password-indicador").textContent =
        !password ? "Requisitos de seguridad" :
        aprobadas === 5 ? "Contraseña válida" :
        `${aprobadas} de 5 requisitos cumplidos`;
}

function configurarVisibilidadPassword(idInput, idBoton) {
    const input = document.getElementById(idInput);
    const boton = document.getElementById(idBoton);

    boton.addEventListener("click", () => {
        const mostrar = input.type === "password";
        input.type = mostrar ? "text" : "password";
        boton.textContent = mostrar ? "Ocultar" : "Mostrar";
        boton.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
        boton.setAttribute("aria-pressed", String(mostrar));
    });
}

function validarFormularioRegistro() {
    let primerError = null;

    for (const id of camposRegistro) {
        if (!actualizarCampoRegistro(id) && !primerError) {
            primerError = document.getElementById(id);
        }
    }

    if (primerError) primerError.focus();
    return !primerError;
}

let datosRegistroPendientes = null;
let tokenRegistroVerificado = null;
let ultimoEnvioRegistro = 0;
let enviandoRegistro = false;

function estadoCodigoRegistro(mensaje, tipo = "") {
    const estado = document.getElementById("registro-codigo-estado");
    estado.textContent = mensaje;
    estado.className = "registro-estado";
    if (tipo) estado.classList.add(tipo);
}

function actualizarReenvioRegistro() {
    const boton = document.getElementById("registro-reenviar");
    const restantes = Math.max(0, Math.ceil((ultimoEnvioRegistro + 60000 - Date.now()) / 1000));
    boton.disabled = restantes > 0 || enviandoRegistro;
    boton.textContent = restantes ? `Reenviar en ${restantes} s` : "Reenviar código";
}

async function registrarUsuario(evento) {
    evento.preventDefault();
    if (!validarFormularioRegistro()) {
        mostrarEstadoRegistro("Revisa los campos señalados antes de continuar.", "error");
        return;
    }

    const datos = {
        nombre: normalizarNombre(valorRegistro("reg-nombre")),
        apellido: normalizarNombre(valorRegistro("reg-apellido")),
        email: valorRegistro("reg-email").trim().toLowerCase(),
        telefono: valorRegistro("reg-telefono"),
        password: valorRegistro("reg-password")
    };

    const boton = document.getElementById("register-boton");
    boton.disabled = true;
    boton.textContent = "Enviando código...";
    mostrarEstadoRegistro("Enviando el código de verificación...");

    try {
        await LaFondaEmail.enviarCodigo(datos.email);
        datosRegistroPendientes = datos;
        tokenRegistroVerificado = null;
        ultimoEnvioRegistro = Date.now();
        document.getElementById("registro-correo-destino").textContent = datos.email;
        document.getElementById("register-form").hidden = true;
        document.getElementById("registro-verificacion").hidden = false;
        document.getElementById("registro-codigo").value = "";
        estadoCodigoRegistro("Revisa tu bandeja de entrada y correo no deseado.");
        actualizarReenvioRegistro();
        document.getElementById("registro-codigo").focus();
    } catch (error) {
        mostrarEstadoRegistro(error.message || "No se pudo enviar el código.", "error");
    } finally {
        boton.disabled = false;
        boton.textContent = "Crear cuenta";
    }
}

async function confirmarRegistro(evento) {
    evento.preventDefault();
    if (!datosRegistroPendientes) return;

    const boton = document.getElementById("registro-confirmar");
    const codigo = document.getElementById("registro-codigo").value.trim();
    boton.disabled = true;
    boton.textContent = "Verificando...";
    estadoCodigoRegistro("Comprobando tu código...");

    try {
        if (!tokenRegistroVerificado) {
            tokenRegistroVerificado = await LaFondaEmail.verificarCodigo(datosRegistroPendientes.email, codigo);
        }
        const sesion = await LaFondaAuth.registerVerified(datosRegistroPendientes, tokenRegistroVerificado);
        datosRegistroPendientes.password = "";
        tokenRegistroVerificado = null;
        estadoCodigoRegistro("Correo verificado y cuenta creada. Ingresando...", "exito");
        const destino = sessionStorage.getItem("lafonda_return_to");
        sessionStorage.removeItem("lafonda_return_to");
        const valido = destino && destino.startsWith("/") && !destino.startsWith("//") && !destino.includes("/acceso/");
        window.location.replace(sesion.rol === "ADMIN" ? "/paginas/acceso/elegir-modo/" : valido ? destino : "/index.html");
    } catch (error) {
        estadoCodigoRegistro(error.message || "No se pudo verificar el correo.", "error");
    } finally {
        boton.disabled = false;
        boton.textContent = "Verificar y crear cuenta";
    }
}

async function reenviarCodigoRegistro() {
    if (!datosRegistroPendientes || enviandoRegistro || Date.now() < ultimoEnvioRegistro + 60000) return;
    enviandoRegistro = true;
    actualizarReenvioRegistro();
    estadoCodigoRegistro("Reenviando código...");
    try {
        await LaFondaEmail.enviarCodigo(datosRegistroPendientes.email);
        ultimoEnvioRegistro = Date.now();
        tokenRegistroVerificado = null;
        estadoCodigoRegistro("Enviamos un nuevo código a tu correo.", "exito");
    } catch (error) {
        estadoCodigoRegistro(error.message || "No se pudo reenviar el código.", "error");
    } finally {
        enviandoRegistro = false;
        actualizarReenvioRegistro();
    }
}

function cambiarCorreoRegistro() {
    if (datosRegistroPendientes) datosRegistroPendientes.password = "";
    datosRegistroPendientes = null;
    tokenRegistroVerificado = null;
    document.getElementById("registro-codigo").value = "";
    document.getElementById("registro-verificacion").hidden = true;
    document.getElementById("register-form").hidden = false;
    mostrarEstadoRegistro("");
    document.getElementById("reg-email").focus();
}

function revisarSesionRegistro() {
    if (LaFondaAuth.getSession()) window.location.href = "/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    revisarSesionRegistro();

    for (const id of camposRegistro) {
        const input = document.getElementById(id);

        input.addEventListener("input", () => {
            if (id === "reg-telefono") {
                input.value = input.value.replace(/\D/g, "").slice(0, 9);
            }

            actualizarCampoRegistro(id, Boolean(input.value) || input.classList.contains("campo-invalido"));

            if (id === "reg-password") {
                actualizarReglasPassword();
                if (valorRegistro("reg-password2")) actualizarCampoRegistro("reg-password2");
            }

            if (document.getElementById("register-status").classList.contains("error")) {
                mostrarEstadoRegistro("");
            }
        });

        input.addEventListener("blur", () => {
            if (id === "reg-nombre" || id === "reg-apellido") {
                input.value = normalizarNombre(input.value);
            }
            if (id === "reg-email") input.value = input.value.trim().toLowerCase();
            actualizarCampoRegistro(id, Boolean(input.value));
        });
    }

    configurarVisibilidadPassword("reg-password", "ver-reg-password");
    configurarVisibilidadPassword("reg-password2", "ver-reg-password2");
    actualizarReglasPassword();

    document.getElementById("register-form").addEventListener("submit", registrarUsuario);
    document.getElementById("registro-codigo-form").addEventListener("submit", confirmarRegistro);
    document.getElementById("registro-codigo").addEventListener("input", evento => {
        evento.target.value = evento.target.value.replace(/\D/g, "").slice(0, 6);
    });
    document.getElementById("registro-reenviar").addEventListener("click", reenviarCodigoRegistro);
    document.getElementById("registro-cambiar").addEventListener("click", cambiarCorreoRegistro);
    setInterval(actualizarReenvioRegistro, 1000);
});
