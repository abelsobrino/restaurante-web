(function () {

    const config =
        window.LAFONDA_CONFIG || {};

    function isConfigured() {

        return Boolean(
            config.supabaseUrl &&
            config.supabaseAnonKey &&
            !String(
                config.supabaseAnonKey
            ).includes("PEGA_AQUI")
        );

    }

    async function rpc(nombre, parametros = {}) {

        if (!isConfigured()) {

            throw new Error(
                "Falta configurar Supabase en js/config.js"
            );

        }

        const respuesta = await fetch(
            `${config.supabaseUrl}/rest/v1/rpc/${nombre}`,
            {
                method: "POST",

                cache: "no-store",

                headers: {
                    apikey:
                        config.supabaseAnonKey,

                    Authorization:
                        `Bearer ${config.supabaseAnonKey}`,

                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(parametros)
            }
        );

        const texto =
            await respuesta.text();

        let datos = null;

        if (texto) {

            try {

                datos =
                    JSON.parse(texto);

            }

            catch {

                datos = texto;

            }

        }

        if (!respuesta.ok) {

            const mensaje =
                datos?.message ||
                datos?.hint ||
                datos?.details ||
                String(
                    datos ||
                    "Error de base de datos"
                );

            throw new Error(mensaje);

        }

        return datos;

    }

    window.LaFondaDB = {

        rpc,
        isConfigured

    };

})();