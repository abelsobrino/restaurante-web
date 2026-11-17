(function () {

    function obtenerSesion() {

        if (
            !window.LaFondaAuth ||
            typeof window.LaFondaAuth.getSession !== "function"
        ) {

            return null;

        }

        return window.LaFondaAuth.getSession();

    }

    function mostrar(elemento, mostrarElemento) {

        if (!elemento) {

            return;

        }

        elemento.hidden =
            !mostrarElemento;

    }

    // El encabezado de React escucha los cambios de sesión.
    function actualizarNavbarSesion() {
        window.dispatchEvent(new Event("lafonda-navbar-refresh"));
    }

    function cerrarSesion() {

        if (
            !window.LaFondaAuth ||
            typeof window.LaFondaAuth.logout !== "function"
        ) {

            console.error(
                "LaFondaAuth.logout no está disponible."
            );

            return;

        }

        window.LaFondaAuth.logout();

    }

    function requerirSesion(
        returnTo = window.location.pathname
    ) {

        const sesion =
            obtenerSesion();

        if (sesion) {

            return true;

        }

        sessionStorage.setItem(
            "lafonda_return_to",
            returnTo
        );

        window.LaFondaNavigate("/paginas/acceso/iniciar-sesion/");

        return false;

    }

    function requerirCliente(
        returnTo = window.location.pathname
    ) {

        const sesion =
            obtenerSesion();

        if (!sesion) {

            sessionStorage.setItem(
                "lafonda_return_to",
                returnTo
            );

            window.LaFondaNavigate("/paginas/acceso/iniciar-sesion/");

            return false;

        }

        if (
            String(
                sesion.rol
            ).toUpperCase() !==
            "CLIENTE"
        ) {

            return false;

        }

        return true;

    }

    function requerirAdministrador() {

        const sesion =
            obtenerSesion();

        if (!sesion) {

            sessionStorage.setItem(
                "lafonda_return_to",
                window.location.pathname
            );

            window.LaFondaNavigate("/paginas/acceso/iniciar-sesion/");

            return false;

        }

        if (
            String(
                sesion.rol
            ).toUpperCase() !==
            "ADMIN"
        ) {

            window.LaFondaNavigate("/index.html");

            return false;

        }

        if (
            String(
                sesion.modo
            ).toUpperCase() !==
            "ADMIN"
        ) {

            window.LaFondaNavigate("/paginas/acceso/elegir-modo/");

            return false;

        }

        return true;

    }

    window.addEventListener(
        "lafonda-session-change",
        () => {

            actualizarNavbarSesion();

        }
    );

    window.addEventListener(
        "pageshow",
        () => {

            actualizarNavbarSesion();

        }
    );

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            actualizarNavbarSesion();

        }
    );

    window.actualizarNavbarSesion =
        actualizarNavbarSesion;

    window.LaFondaSesion = {

        obtenerSesion,

        actualizarNavbarSesion,

        cerrarSesion,

        requerirSesion,

        requerirCliente,

        requerirAdministrador

    };

})();