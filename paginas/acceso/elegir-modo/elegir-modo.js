

function verificarAdministrador() {

    if (
        !window.LaFondaAuth
    ) {

        window.location.href =
            "/index.html";

        return false;

    }

    if (
        !LaFondaAuth.isAdmin()
    ) {

        window.location.href =
            "/index.html";

        return false;

    }

    return true;

}

function entrarComoAdmin() {

    const sesion =
        LaFondaAuth.setMode(
            "ADMIN"
        );

    if (!sesion) {

        window.location.href =
            "/index.html";

        return;

    }

    window.location.href =
        "/paginas/administrador/panel/";

}

function entrarComoCliente() {

    const sesion =
        LaFondaAuth.setMode(
            "CLIENTE"
        );

    if (!sesion) {

        window.location.href =
            "/index.html";

        return;

    }

    window.location.href =
        "/index.html";

}

function configurarEventosModo() {

    document.getElementById(
        "mode-admin"
    ).addEventListener(
        "click",
        entrarComoAdmin
    );

    document.getElementById(
        "mode-client"
    ).addEventListener(
        "click",
        entrarComoCliente
    );

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            !verificarAdministrador()
        ) {

            return;

        }

        configurarEventosModo();

    }
);