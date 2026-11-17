(function () {
    function configuracion() {
        const config = window.LAFONDA_CONFIG || {};
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            throw new Error("Falta configurar Supabase.");
        }
        return config;
    }

    async function solicitud(ruta, cuerpo) {
        const config = configuracion();
        const respuesta = await fetch(`${config.supabaseUrl}/auth/v1/${ruta}`, {
            method: "POST",
            cache: "no-store",
            headers: {
                apikey: config.supabaseAnonKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cuerpo)
        });
        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) {
            if (respuesta.status === 429) {
                throw new Error("Se alcanzó el límite de solicitudes. Intenta nuevamente más tarde.");
            }
            if (respuesta.status === 422 && /expired|invalid|incorrect/i.test(datos.msg || datos.message || "")) {
                throw new Error("El código es incorrecto o ya expiró. Solicita uno nuevo.");
            }
            throw new Error(datos.msg || datos.message || datos.error_description || "No se pudo completar la verificación.");
        }
        return datos;
    }

    async function enviarCodigo(email) {
        await solicitud("otp", { email: email.trim().toLowerCase(), create_user: true });
    }

    async function verificarCodigo(email, codigo) {
        if (!/^\d{6}$/.test(codigo)) {
            throw new Error("Ingresa el código de seis dígitos.");
        }
        const resultado = await solicitud("verify", {
            email: email.trim().toLowerCase(),
            token: codigo,
            type: "email"
        });
        if (!resultado.access_token) {
            throw new Error("No se pudo validar el correo. Solicita un nuevo código.");
        }
        return resultado.access_token;
    }

    window.LaFondaEmail = { enviarCodigo, verificarCodigo };
})();
