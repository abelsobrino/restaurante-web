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

    function actualizarNavbarSesion() {

        const sesion =
            obtenerSesion();

        const nombreUsuario =
            document.getElementById(
                "user-display-name"
            );

        const botonUsuario =
            document.getElementById(
                "nav-user-btn"
            );

        const perfil =
            document.getElementById(
                "dropdown-profile"
            );

        const adminItem =
            document.getElementById(
                "nav-admin-item"
            );

        const pedidosRow =
            document.getElementById(
                "dropdown-pedidos-row"
            );

        const reservasRow =
            document.getElementById(
                "dropdown-reservas-row"
            );

        const modoRow =
            document.getElementById(
                "dropdown-mode-row"
            );

        const modoLink =
            document.getElementById(
                "dropdown-mode"
            );

        const separadorRow =
            document.getElementById(
                "dropdown-divider-row"
            );

        const logoutRow =
            document.getElementById(
                "dropdown-logout-row"
            );

        const logout =
            document.getElementById(
                "dropdown-logout"
            );

        if (
            !nombreUsuario &&
            !perfil
        ) {

            return;

        }

        if (!sesion) {

            if (nombreUsuario) {

                nombreUsuario.textContent =
                    "Cuenta";

            }

            if (perfil) {

                perfil.innerHTML =
                    '<i class="fa-regular fa-user"></i><span>Iniciar sesión</span>';

                perfil.href =
                    "/paginas/acceso/iniciar-sesion/";

            }

            botonUsuario?.classList.remove(
                "logged-in"
            );

            mostrar(
                adminItem,
                false
            );

            mostrar(
                pedidosRow,
                false
            );

            mostrar(
                reservasRow,
                false
            );

            mostrar(
                modoRow,
                false
            );

            mostrar(
                separadorRow,
                false
            );

            mostrar(
                logoutRow,
                false
            );

            return;

        }

        const nombre =

            String(
                sesion.nombre ||
                ""
            )
                .trim()
                .split(/\s+/)[0]

            ||

            String(
                sesion.email ||
                ""
            )
                .split("@")[0]

            ||

            "Cuenta";

        if (nombreUsuario) {

            nombreUsuario.textContent =
                nombre;

        }

        if (perfil) {

            perfil.innerHTML =
                '<i class="fa-regular fa-user"></i><span>Mi perfil</span>';

            perfil.href =
                "/paginas/perfil/";

        }

        botonUsuario?.classList.add(
            "logged-in"
        );

        mostrar(
            separadorRow,
            true
        );

        mostrar(
            logoutRow,
            true
        );

        if (
            logout &&
            logout.dataset.listener !== "true"
        ) {

            logout.dataset.listener =
                "true";

            logout.addEventListener(
                "click",
                evento => {

                    evento.preventDefault();

                    cerrarSesion();

                }
            );

        }

        if (
            String(
                sesion.rol
            ).toUpperCase() ===
            "CLIENTE"
        ) {

            mostrar(
                adminItem,
                false
            );

            mostrar(
                pedidosRow,
                true
            );

            mostrar(
                reservasRow,
                true
            );

            mostrar(
                modoRow,
                false
            );

            return;

        }

        if (
            String(
                sesion.rol
            ).toUpperCase() ===
            "ADMIN"
        ) {

            mostrar(

                adminItem,

                String(
                    sesion.modo
                ).toUpperCase() ===
                "ADMIN"

            );

            mostrar(
                pedidosRow,
                false
            );

            mostrar(
                reservasRow,
                false
            );

            mostrar(
                modoRow,
                true
            );

            if (modoLink) {

                const enAdmin =
                    String(
                        sesion.modo
                    ).toUpperCase() ===
                    "ADMIN";

                modoLink.innerHTML =
                    enAdmin
                        ? '<i class="fa-solid fa-store"></i><span>Ver como usuario</span>'
                        : '<i class="fa-solid fa-shield-halved"></i><span>Volver a administración</span>';

                modoLink.href = "#";
                modoLink.dataset.targetMode =
                    enAdmin
                        ? "CLIENTE"
                        : "ADMIN";

                if (
                    modoLink.dataset.listener !==
                    "true"
                ) {

                    modoLink.dataset.listener =
                        "true";

                    modoLink.addEventListener(
                        "click",
                        evento => {

                            evento.preventDefault();

                            const destino =
                                modoLink.dataset.targetMode;

                            const actualizada =
                                LaFondaAuth.setMode(
                                    destino
                                );

                            if (!actualizada) {
                                return;
                            }

                            window.location.href =
                                destino === "ADMIN"
                                    ? "/paginas/administrador/panel/"
                                    : "/index.html";

                        }
                    );

                }

            }

            return;

        }

        mostrar(
            adminItem,
            false
        );

        mostrar(
            pedidosRow,
            false
        );

        mostrar(
            reservasRow,
            false
        );

        mostrar(
            modoRow,
            false
        );

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

        window.location.href =
            "/paginas/acceso/iniciar-sesion/";

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

            window.location.href =
                "/paginas/acceso/iniciar-sesion/";

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

            window.location.href =
                "/paginas/acceso/iniciar-sesion/";

            return false;

        }

        if (
            String(
                sesion.rol
            ).toUpperCase() !==
            "ADMIN"
        ) {

            window.location.href =
                "/index.html";

            return false;

        }

        if (
            String(
                sesion.modo
            ).toUpperCase() !==
            "ADMIN"
        ) {

            window.location.href =
                "/paginas/acceso/elegir-modo/";

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