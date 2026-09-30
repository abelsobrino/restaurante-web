(function () {

    const SESSION_KEY =
        "lafonda_web_session";

    const LEGACY_KEY =
        "la_fonda_user";

    function getSession() {

        try {

            const datos =
                sessionStorage.getItem(
                    SESSION_KEY
                );

            return JSON.parse(
                datos || "null"
            );

        }

        catch (error) {

            console.error(
                "No se pudo leer la sesión:",
                error
            );

            return null;

        }

    }

    function writeSession(session) {

        sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify(session)
        );

        localStorage.setItem(
            LEGACY_KEY,
            JSON.stringify({
                nombre:
                    session.nombre ||
                    session.email?.split("@")[0] ||
                    "Usuario",

                email:
                    session.email,

                rol:
                    session.rol,

                loginTime:
                    new Date().toISOString()
            })
        );

        window.dispatchEvent(
            new CustomEvent(
                "lafonda-session-change",
                {
                    detail: session
                }
            )
        );

        return session;

    }

    function clearSession() {

        sessionStorage.removeItem(
            SESSION_KEY
        );

        localStorage.removeItem(
            LEGACY_KEY
        );

        window.dispatchEvent(
            new CustomEvent(
                "lafonda-session-change",
                {
                    detail: null
                }
            )
        );

    }

    async function login(email, password) {

        if (!window.LaFondaDB) {

            throw new Error(
                "La conexión con la base de datos no está disponible."
            );

        }

        const resultado =
            await window.LaFondaDB.rpc(
                "web_login",
                {
                    p_email: email,
                    p_password: password
                }
            );

        if (!resultado?.ok) {

            throw new Error(
                resultado?.mensaje ||
                "No se pudo iniciar sesión"
            );

        }

        return writeSession({

            id:
                resultado.id,

            nombre:
                resultado.nombre,

            apellido:
                resultado.apellido || "",

            email:
                resultado.email,

            telefono:
                resultado.telefono || "",

            rol:
                resultado.rol,

            modo:
                resultado.rol === "ADMIN"
                    ? null
                    : "CLIENTE",

            password:
                password

        });

    }

    async function register({
        nombre,
        apellido,
        email,
        telefono,
        password
    }) {

        if (!window.LaFondaDB) {

            throw new Error(
                "La conexión con la base de datos no está disponible."
            );

        }

        const resultado =
            await window.LaFondaDB.rpc(
                "web_registrar_cliente",
                {
                    p_nombre:
                        nombre,

                    p_apellido:
                        apellido,

                    p_email:
                        email,

                    p_telefono:
                        telefono || "",

                    p_password:
                        password
                }
            );

        if (!resultado?.ok) {

            throw new Error(
                resultado?.mensaje ||
                "No se pudo crear la cuenta"
            );

        }

        return login(
            email,
            password
        );

    }

    function setMode(modo) {

        const sesion =
            getSession();

        if (
            !sesion ||
            sesion.rol !== "ADMIN"
        ) {

            return null;

        }

        sesion.modo =
            modo === "ADMIN"
                ? "ADMIN"
                : "CLIENTE";

        return writeSession(
            sesion
        );

    }

    function isAdmin() {

        return (
            getSession()?.rol === "ADMIN"
        );

    }

    function isClient() {

        return (
            getSession()?.rol === "CLIENTE"
        );

    }

    function credentials(rol = null) {

        const sesion =
            getSession();

        if (!sesion) {

            throw new Error(
                "Inicia sesión para continuar"
            );

        }

        if (
            rol &&
            sesion.rol !== rol
        ) {

            throw new Error(

                rol === "ADMIN"

                    ? "Acceso exclusivo para administrador"

                    : "Inicia sesión con una cuenta de cliente"

            );

        }

        return {

            email:
                sesion.email,

            password:
                sesion.password

        };

    }

    function requireLogin(
        returnTo = window.location.pathname
    ) {

        if (getSession()) {

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

    function logout() {

        clearSession();

        window.location.href =
            "/index.html";

    }

    window.LaFondaAuth = {

        getSession,

        login,

        register,

        setMode,

        isAdmin,

        isClient,

        credentials,

        requireLogin,

        logout,

        clearSession

    };

})();