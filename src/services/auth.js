(function () {

    const SESSION_KEY =
        "lafonda_web_session";

    const LEGACY_KEY =
        "la_fonda_user";

    // El contrato SQL actual requiere la contraseña en varias RPC. Mientras se
    // migra a tokens de servidor, nunca persistirla en localStorage/sessionStorage.
    // Al recargar por completo el navegador se solicita un nuevo inicio de sesión.
    let activeSession = null;
    let passwordInMemory = null;

    try {
        sessionStorage.removeItem(SESSION_KEY); // Limpia datos de versiones antiguas.
        localStorage.removeItem(LEGACY_KEY);
    } catch { /* El almacenamiento puede estar bloqueado (modo privado). */ }

    function getSession() {
        return activeSession ? { ...activeSession } : null;
    }

    function writeSession(session, password) {
        const publicSession = { ...session };
        delete publicSession.password;
        if (typeof password !== "string" || !password) {
            throw new Error("Se requiere iniciar sesión nuevamente.");
        }
        activeSession = { ...publicSession };
        passwordInMemory = password;

        // Dato de compatibilidad para la actualización visual entre pestañas:
        // solo perfil público, nunca el secreto de autenticación.
        try {
            localStorage.setItem(LEGACY_KEY, JSON.stringify({
                nombre: activeSession.nombre || activeSession.email?.split("@")[0] || "Usuario",
                email: activeSession.email,
                rol: activeSession.rol,
                loginTime: new Date().toISOString()
            }));
        } catch { /* Continúa sin almacenamiento persistente. */ }

        const visible = getSession();
        window.dispatchEvent(new CustomEvent("lafonda-session-change", { detail: visible }));
        return visible;
    }

    function clearSession() {
        activeSession = null;
        passwordInMemory = null;
        try {
            sessionStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(LEGACY_KEY);
        } catch { /* Continúa incluso sin acceso a storage. */ }
        window.dispatchEvent(new CustomEvent("lafonda-session-change", { detail: null }));
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
                    : "CLIENTE"

        }, password);

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
                "web_registrar_cliente_validado",
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

    async function registerVerified(datos, accessToken) {

        if (!accessToken || !window.LaFondaDB) {
            throw new Error("Debes verificar tu correo antes de crear la cuenta.");
        }

        const resultado = await window.LaFondaDB.rpc(
            "web_confirmar_registro_cliente",
            {
                p_nombre: datos.nombre,
                p_apellido: datos.apellido,
                p_email: datos.email,
                p_telefono: datos.telefono,
                p_password: datos.password
            },
            { accessToken }
        );

        if (!resultado?.ok) {
            throw new Error(resultado?.mensaje || "No se pudo crear la cuenta.");
        }

        return login(datos.email, datos.password);
    }

    async function resetPasswordVerified(email, password, accessToken) {

        if (!accessToken || !window.LaFondaDB) {
            throw new Error("Verifica tu correo para cambiar la contraseña.");
        }

        const resultado = await window.LaFondaDB.rpc(
            "web_restablecer_contrasena_cliente",
            { p_email: email, p_password: password },
            { accessToken }
        );

        if (!resultado?.ok) {
            throw new Error(resultado?.mensaje || "No se pudo actualizar la contraseña.");
        }

        return resultado;
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
            sesion,
            passwordInMemory
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

        const sesion = getSession();

        if (!sesion || !passwordInMemory) {
            throw new Error("Inicia sesión para continuar");
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
                passwordInMemory

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

        window.LaFondaNavigate("/paginas/acceso/iniciar-sesion/");

        return false;

    }

    function logout() {

        clearSession();

        window.LaFondaNavigate("/index.html");

    }

    window.LaFondaAuth = {

        getSession,

        login,

        register,

        registerVerified,

        resetPasswordVerified,

        setMode,

        isAdmin,

        isClient,

        credentials,

        requireLogin,

        logout,

        clearSession

    };

})();