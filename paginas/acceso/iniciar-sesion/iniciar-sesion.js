

function mostrarEstadoLogin(
    mensaje,
    tipo = ""
) {

    const estado =
        document.getElementById(
            "login-status"
        );

    estado.textContent =
        mensaje;

    estado.className =
        "acceso-estado";

    if (tipo) {

        estado.classList.add(
            tipo
        );

    }

}

function emailLoginValido(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}

function configurarMostrarPassword() {

    const input =
        document.getElementById(
            "login-password"
        );

    const boton =
        document.getElementById(
            "mostrar-password"
        );

    boton.addEventListener(
        "click",
        () => {

            const visible =
                input.type ===
                "text";

            input.type =
                visible
                    ? "password"
                    : "text";

            boton.innerHTML =
                visible
                    ? '<i class="fa-regular fa-eye"></i>'
                    : '<i class="fa-regular fa-eye-slash"></i>';

        }
    );

}

async function iniciarSesion(
    evento
) {

    evento.preventDefault();

    const email =
        document
            .getElementById(
                "login-email"
            )
            .value
            .trim()
            .toLowerCase();

    const password =
        document.getElementById(
            "login-password"
        ).value;

    if (
        !emailLoginValido(
            email
        )
    ) {

        mostrarEstadoLogin(
            "Ingresa un correo electrónico válido.",
            "error"
        );

        return;

    }

    if (
        password.length < 6
    ) {

        mostrarEstadoLogin(
            "La contraseña debe tener al menos 6 caracteres.",
            "error"
        );

        return;

    }

    const boton =
        document.getElementById(
            "login-boton"
        );

    boton.disabled = true;

    boton.textContent =
        "Validando...";

    mostrarEstadoLogin(
        "Consultando la base de datos..."
    );

    try {

        const sesion =
            await LaFondaAuth.login(
                email,
                password
            );

        mostrarEstadoLogin(
            "Inicio de sesión correcto.",
            "exito"
        );

        if (
            sesion.rol === "ADMIN"
        ) {

            window.location.href =
                "/paginas/acceso/elegir-modo/";

            return;

        }

        const destino =
            sessionStorage.getItem(
                "lafonda_return_to"
            );

        sessionStorage.removeItem(
            "lafonda_return_to"
        );

        if (
            destino &&
            !destino.includes(
                "/acceso/"
            )
        ) {

            window.location.href =
                destino;

        }

        else {

            window.location.href =
                "/index.html";

        }

    }

    catch (error) {

        mostrarEstadoLogin(
            error.message,
            "error"
        );

    }

    finally {

        boton.disabled = false;

        boton.textContent =
            "Iniciar sesión";

    }

}

function revisarSesionExistente() {

    const sesion =
        LaFondaAuth.getSession();

    if (!sesion) {

        return;

    }

    if (
        sesion.rol === "ADMIN" &&
        !sesion.modo
    ) {

        window.location.href =
            "/paginas/acceso/elegir-modo/";

        return;

    }

    window.location.href =
        "/index.html";

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        revisarSesionExistente();

        configurarMostrarPassword();

        document.getElementById(
            "login-form"
        ).addEventListener(
            "submit",
            iniciarSesion
        );

    }
);