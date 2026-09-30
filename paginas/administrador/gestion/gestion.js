const gestionState = {
    platosAdmin: [],
    catalogo: null,
    filtro: "TODOS",
    busqueda: ""
};

function GestionAdmin() {
    return window.LaFondaAdmin;
}

function platoCatalogo(id) {
    return (gestionState.catalogo?.platos || []).find(
        (plato) => Number(plato.id) === Number(id)
    ) || null;
}

function infoDisponibilidad(platoAdmin) {
    const publicado = platoAdmin.disponible !== false;
    const catalogo = platoCatalogo(platoAdmin.id);

    if (!publicado) {
        return {
            publicado: false,
            confirmado: true,
            texto: "No publicado",
            clase: "off",
            fuente: "Estado del catálogo"
        };
    }

    if (!catalogo) {
        return {
            publicado: true,
            confirmado: false,
            texto: "No visible",
            clase: "alerta",
            fuente: "No aparece en web_catalogo"
        };
    }

    if (!window.LaFondaStock) {
        return {
            publicado: true,
            confirmado: false,
            texto: "Publicado",
            clase: "neutro",
            fuente: "Catálogo web"
        };
    }

    const stock = window.LaFondaStock.info(catalogo);

    if (!stock.confiable) {
        return {
            publicado: true,
            confirmado: false,
            texto: "Publicado",
            clase: "neutro",
            fuente: "Stock diario no expuesto al navegador"
        };
    }

    if (!stock.disponible) {
        return {
            publicado: true,
            confirmado: true,
            texto: "Sin stock",
            clase: "off",
            fuente: window.LaFondaStock.describirFuente(catalogo)
        };
    }

    return {
        publicado: true,
        confirmado: true,
        texto: stock.cantidad === null ? "Disponible" : `Disponible: ${stock.cantidad}`,
        clase: "ok",
        fuente: window.LaFondaStock.describirFuente(catalogo)
    };
}

function actualizarResumenGestion() {
    const platos = gestionState.platosAdmin;
    const estados = platos.map(infoDisponibilidad);

    document.getElementById("gestion-total").textContent = platos.length;
    document.getElementById("gestion-publicados").textContent = estados.filter((x) => x.publicado).length;
    document.getElementById("gestion-ocultos").textContent = estados.filter((x) => !x.publicado).length;
    document.getElementById("gestion-stock-confirmado").textContent = estados.filter((x) => x.confirmado && x.publicado).length;
}

function platosGestionFiltrados() {
    const q = gestionState.busqueda.trim().toLowerCase();

    return gestionState.platosAdmin.filter((plato) => {
        const coincideTexto = !q || `${plato.nombre || ""} ${plato.categoria || ""}`.toLowerCase().includes(q);
        if (!coincideTexto) return false;

        const info = infoDisponibilidad(plato);

        if (gestionState.filtro === "PUBLICADO") return info.publicado;
        if (gestionState.filtro === "OCULTO") return !info.publicado;
        if (gestionState.filtro === "CONFIRMADO") return info.publicado && info.confirmado;
        if (gestionState.filtro === "NO_EXPUESTO") return info.publicado && !info.confirmado;
        return true;
    });
}

function renderGestion() {
    const Admin = GestionAdmin();
    const body = document.getElementById("gestion-stock-body");
    const filas = platosGestionFiltrados();

    if (!filas.length) {
        body.innerHTML = `<tr><td colspan="5" class="gestion-cargando">No hay platos con este filtro.</td></tr>`;
        return;
    }

    body.innerHTML = filas.map((plato) => {
        const info = infoDisponibilidad(plato);

        return `
            <tr>
                <td>
                    <strong>${Admin.esc(plato.nombre || "Plato")}</strong>
                    <small>ID ${Number(plato.id)}</small>
                </td>
                <td>${Admin.esc(plato.categoria || "Sin categoría")}</td>
                <td>
                    <span class="gestion-estado ${info.publicado ? "ok" : "off"}">
                        <i class="fa-solid ${info.publicado ? "fa-eye" : "fa-eye-slash"}"></i>
                        ${info.publicado ? "Publicado" : "Oculto"}
                    </span>
                </td>
                <td>
                    <span class="gestion-estado ${info.clase}">
                        <i class="fa-solid ${info.clase === "ok" ? "fa-circle-check" : info.clase === "off" ? "fa-circle-xmark" : info.clase === "alerta" ? "fa-triangle-exclamation" : "fa-circle-info"}"></i>
                        ${Admin.esc(info.texto)}
                    </span>
                </td>
                <td class="gestion-fuente">${Admin.esc(info.fuente)}</td>
            </tr>
        `;
    }).join("");
}

async function cargarGestion() {
    const Admin = GestionAdmin();

    try {
        Admin.setStatus("Actualizando información compartida...");

        const [datosAdmin, catalogo] = await Promise.all([
            Admin.rpc("web_admin_platos"),
            LaFondaDB.rpc("web_catalogo", {})
        ]);

        if (
            window.LaFondaStock?.enriquecerCatalogo
        ) {

            await window.LaFondaStock
                .enriquecerCatalogo(
                    catalogo
                );

        }

        gestionState.platosAdmin = datosAdmin?.platos || [];
        gestionState.catalogo = catalogo || { platos: [] };

        actualizarResumenGestion();
        renderGestion();
        Admin.setStatus("Datos actualizados. La web no modificó ningún valor de stock.", "success");
    } catch (error) {
        console.error(error);
        Admin.setStatus(error.message, "error");
    }
}

function configurarGestionEventos() {
    document.getElementById("gestion-busqueda").addEventListener("input", (evento) => {
        gestionState.busqueda = evento.target.value;
        renderGestion();
    });

    document.getElementById("gestion-filtro").addEventListener("change", (evento) => {
        gestionState.filtro = evento.target.value;
        renderGestion();
    });

    document.getElementById("gestion-recargar").addEventListener("click", cargarGestion);
}

document.addEventListener("DOMContentLoaded", async () => {
    const Admin = GestionAdmin();
    if (!Admin || !Admin.verificarAcceso()) return;

    configurarGestionEventos();
    await cargarGestion();
});
