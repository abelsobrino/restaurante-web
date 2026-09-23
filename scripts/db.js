(function () {
    const config = window.LAFONDA_CONFIG || {};

    function isConfigured() {
        return Boolean(
            config.supabaseUrl &&
            config.supabaseAnonKey &&
            !String(config.supabaseAnonKey).includes("PEGA_AQUI")
        );
    }

    async function rpc(name, params = {}) {
        if (!isConfigured()) {
            throw new Error("Falta configurar SUPABASE_ANON_KEY en scripts/config.js");
        }

        const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
            method: "POST",
            headers: {
                apikey: config.supabaseAnonKey,
                Authorization: `Bearer ${config.supabaseAnonKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(params)
        });

        const text = await response.text();
        let data = null;
        if (text) {
            try { data = JSON.parse(text); }
            catch { data = text; }
        }

        if (!response.ok) {
            const message = data?.message || data?.hint || data?.details || String(data || "Error de base de datos");
            throw new Error(message);
        }
        return data;
    }

    window.LaFondaDB = { rpc, isConfigured };
})();
