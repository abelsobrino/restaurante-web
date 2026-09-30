(function () {

    function obtenerSesion() {

        if (
            !window.LaFondaAuth
        ) {

            return null;

        }

        return LaFondaAuth.getSession();

    }

    function verificarAcceso() {

        const sesion =
            obtenerSesion();

        if (
            !sesion ||
            sesion.rol !== "ADMIN"
        ) {

            sessionStorage.setItem(
                "lafonda_return_to",
                window.location.pathname
            );

            window.location.href =
                "/paginas/acceso/iniciar-sesion/";

            return null;

        }

        if (
            sesion.modo !== "ADMIN"
        ) {

            window.location.href =
                "/paginas/acceso/elegir-modo/";

            return null;

        }

        return sesion;

    }

    function credenciales() {

        const sesion =
            obtenerSesion();

        if (!sesion) {

            throw new Error(
                "La sesión no está disponible."
            );

        }

        return {

            p_email:
                sesion.email,

            p_password:
                sesion.password

        };

    }

    async function rpc(
        nombre,
        parametros = {}
    ) {

        if (!window.LaFondaDB) {

            throw new Error(
                "La conexión con la base de datos no está disponible."
            );

        }

        return await LaFondaDB.rpc(
            nombre,
            {

                ...credenciales(),

                ...parametros

            }
        );

    }

    function money(valor) {

        return `S/ ${Number(
            valor || 0
        ).toFixed(2)}`;

    }

    function esc(valor) {

        return String(valor ?? "")
            .replace(
                /[&<>'"]/g,
                caracter => ({

                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "'": "&#39;",
                    '"': "&quot;"

                })[caracter]
            );

    }

    function setStatus(
        mensaje,
        tipo = ""
    ) {

        const elemento =
            document.getElementById(
                "admin-status"
            );

        if (!elemento) {

            return;

        }

        elemento.textContent =
            mensaje || "";

        elemento.className =
            "admin-status";

        if (tipo) {

            elemento.classList.add(
                tipo
            );

        }

    }

    function obtenerModuloActual() {

        const ruta =
            window.location.pathname;

        const modulos = [

            "panel",
            "menu",
            "gestion",
            "promociones",
            "contenido",
            "reportes",
            "configuracion"

        ];

        return (
            modulos.find(
                modulo =>
                    ruta.includes(
                        `/administrador/${modulo}/`
                    )
            ) ||
            "panel"
        );

    }

    function marcarMenuActivo() {

        const modulo =
            obtenerModuloActual();

        document
            .querySelectorAll(
                "[data-admin-route]"
            )
            .forEach(
                enlace => {

                    enlace.classList.toggle(

                        "active",

                        enlace.dataset
                            .adminRoute ===
                        modulo

                    );

                }
            );

    }

    function configurarCambioVista() {

        document
            .querySelectorAll(
                "[data-admin-view]"
            )
            .forEach(
                boton => {

                    boton.addEventListener(
                        "click",
                        () => {

                            const vista =
                                boton.dataset.adminView;

                            if (
                                !window.LaFondaAuth ||
                                !LaFondaAuth.isAdmin()
                            ) {
                                return;
                            }

                            LaFondaAuth.setMode(
                                vista === "ADMIN"
                                    ? "ADMIN"
                                    : "CLIENTE"
                            );

                            window.location.href =
                                vista === "ADMIN"
                                    ? "/paginas/administrador/panel/"
                                    : "/index.html";

                        }
                    );

                }
            );

    }

    async function cargarMenu() {

        const contenedor =
            document.getElementById(
                "admin-menu"
            );

        if (!contenedor) {

            return;

        }

        try {

            const respuesta =
                await fetch(
                    "/paginas/administrador/componentes/menu/index.html"
                );

            if (!respuesta.ok) {

                throw new Error(
                    "No se pudo cargar el menú administrativo."
                );

            }

            contenedor.innerHTML =
                await respuesta.text();

            marcarMenuActivo();

            configurarCambioVista();

        }

        catch (error) {

            console.error(
                error
            );

            contenedor.innerHTML = `

                <div class="admin-menu-error">

                    No se pudo cargar
                    el menú administrativo.

                </div>

            `;

        }

    }

    function val(id) {

        const elemento =
            document.getElementById(id);

        return elemento
            ? elemento.value.trim()
            : "";

    }

    function numeroONull(id) {

        const valor =
            val(id);

        return valor === ""
            ? null
            : Number(valor);

    }

    async function inicializar() {

        const sesion =
            verificarAcceso();

        if (!sesion) {

            return;

        }

        await cargarMenu();

    }

    window.LaFondaAdmin = {

        obtenerSesion,

        verificarAcceso,

        credenciales,

        rpc,

        money,

        esc,

        setStatus,

        val,

        numeroONull,

        obtenerModuloActual

    };

    document.addEventListener(
        "DOMContentLoaded",
        inicializar
    );

})();