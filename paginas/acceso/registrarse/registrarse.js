

function mostrarEstadoRegistro(
    mensaje,
    tipo = ""
) {

    const estado =
        document.getElementById(
            "register-status"
        );

    estado.textContent =
        mensaje;

    estado.className =
        "registro-estado";

    if (tipo) {

        estado.classList.add(
            tipo
        );

    }

}

function emailRegistroValido(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}

function limitarTelefonoRegistro() {

    const input =
        document.getElementById(
            "reg-telefono"
        );

    input.value =
        input.value
            .replace(/\D/g, "")
            .slice(0, 15);

}

async function registrarUsuario(
    evento
) {

    evento.preventDefault();

    const nombre =
        document
            .getElementById(
                "reg-nombre"
            )
            .value
            .trim();

    const apellido =
        document
            .getElementById(
                "reg-apellido"
            )
            .value
            .trim();

    const email =
        document
            .getElementById(
                "reg-email"
            )
            .value
            .trim()
            .toLowerCase();

    const telefono =
        document
            .getElementById(
                "reg-telefono"
            )
            .value
            .trim();

    const password =
        document.getElementById(
            "reg-password"
        ).value;

    const password2 =
        document.getElementById(
            "reg-password2"
        ).value;

    if (
        !nombre ||
        !apellido
    ) {

        mostrarEstadoRegistro(
            "Completa nombre y apellido.",
            "error"
        );

        return;

    }

    if (
        nombre.length < 2 ||
        apellido.length < 2
    ) {

        mostrarEstadoRegistro(
            "Ingresa un nombre y apellido válidos.",
            "error"
        );

        return;

    }

    if (
        !emailRegistroValido(
            email
        )
    ) {

        mostrarEstadoRegistro(
            "Ingresa un correo electrónico válido.",
            "error"
        );

        return;

    }

    if (
        telefono &&
        !/^\d{7,15}$/.test(
            telefono
        )
    ) {

        mostrarEstadoRegistro(
            "Ingresa un teléfono válido.",
            "error"
        );

        return;

    }

    if (
        password.length < 6
    ) {

        mostrarEstadoRegistro(
            "La contraseña debe tener al menos 6 caracteres.",
            "error"
        );

        return;

    }

    if (
        password !== password2
    ) {

        mostrarEstadoRegistro(
            "Las contraseñas no coinciden.",
            "error"
        );

        return;

    }

    const boton =
        document.getElementById(
            "register-boton"
        );

    boton.disabled = true;

    boton.textContent =
        "Creando cuenta...";

    mostrarEstadoRegistro(
        "Registrando tu cuenta..."
    );

    try {

        await LaFondaAuth.register({

            nombre,

            apellido,

            email,

            telefono,

            password

        });

        mostrarEstadoRegistro(
            "Cuenta creada correctamente. Ingresando...",
            "exito"
        );

        const destino =
            sessionStorage.getItem(
                "lafonda_return_to"
            );

        sessionStorage.removeItem(
            "lafonda_return_to"
        );

        setTimeout(
            () => {

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

            },
            500
        );

    }

    catch (error) {

        mostrarEstadoRegistro(
            error.message,
            "error"
        );

    }

    finally {

        boton.disabled = false;

        boton.textContent =
            "Crear cuenta";

    }

}

function revisarSesionRegistro() {

    if (
        LaFondaAuth.getSession()
    ) {

        window.location.href =
            "/index.html";

    }

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        revisarSesionRegistro();

        document.getElementById(
            "reg-telefono"
        ).addEventListener(
            "input",
            limitarTelefonoRegistro
        );

        document.getElementById(
            "register-form"
        ).addEventListener(
            "submit",
            registrarUsuario
        );

    }
);