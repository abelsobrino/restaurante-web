const reporteState = {
    periodo: "DIA",
    datos: null
};

function ReporteAdmin() {
    return window.LaFondaAdmin;
}

async function cargarReporte() {
    const Admin = ReporteAdmin();

    try {
        Admin.setStatus("Cargando reporte...");
        const datos = await Admin.rpc("web_admin_estadisticas", {
            p_periodo: reporteState.periodo
        });

        reporteState.datos = datos || {};
        renderReporte();
        Admin.setStatus("");
    } catch (error) {
        console.error(error);
        Admin.setStatus(error.message, "error");
    }
}

function renderReporte() {
    const Admin = ReporteAdmin();
    const d = reporteState.datos || {};

    document.getElementById("reporte-ventas").textContent = d.ventas || 0;
    document.getElementById("reporte-total").textContent = Admin.money(d.total);
    document.getElementById("reporte-ticket").textContent = Admin.money(d.ticket_promedio);
    document.getElementById("reporte-origen").textContent = `${d.web || 0} / ${d.presencial || 0}`;

    const top = d.top_platos || [];
    const topWrap = document.getElementById("reporte-top");

    topWrap.innerHTML = top.length
        ? top.map((item, indice) => `
            <div class="reporte-top-item">
                <span class="reporte-posicion">${indice + 1}</span>
                <div>
                    <strong>${Admin.esc(item.nombre || "Plato")}</strong>
                    <small>${Number(item.cantidad || 0)} unidades</small>
                </div>
                <span class="reporte-top-importe">${Admin.money(item.importe)}</span>
            </div>
        `).join("")
        : `<div class="empty-admin">Sin ventas en este período.</div>`;

    const ventas = d.ultimas_ventas || [];
    const ventasWrap = document.getElementById("reporte-ventas-tabla");

    ventasWrap.innerHTML = ventas.length
        ? `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Pedido</th>
                        <th>Origen</th>
                        <th>Tipo</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${ventas.map((venta) => `
                        <tr>
                            <td>${new Date(venta.created_at).toLocaleString("es-PE")}</td>
                            <td>${Admin.esc(venta.codigo || "")}</td>
                            <td>${Admin.esc(venta.origen || "")}</td>
                            <td>${Admin.esc(venta.tipo || "")}</td>
                            <td>${Admin.money(venta.total)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `
        : `<div class="empty-admin">Sin ventas en este período.</div>`;
}

function csvEsc(valor) {
    const texto = String(valor ?? "");
    return `"${texto.replaceAll('"', '""')}"`;
}

function exportarReporteCsv() {
    const d = reporteState.datos;
    if (!d) return;

    const filas = [
        ["REPORTE LA FONDA"],
        ["Periodo", reporteState.periodo],
        ["Ventas", d.ventas || 0],
        ["Total", Number(d.total || 0).toFixed(2)],
        ["Ticket promedio", Number(d.ticket_promedio || 0).toFixed(2)],
        ["Web", d.web || 0],
        ["Presencial", d.presencial || 0],
        [],
        ["PLATOS MAS VENDIDOS"],
        ["Plato", "Cantidad", "Importe"],
        ...(d.top_platos || []).map((item) => [item.nombre || "", item.cantidad || 0, Number(item.importe || 0).toFixed(2)]),
        [],
        ["ULTIMAS VENTAS"],
        ["Fecha", "Pedido", "Origen", "Tipo", "Total"],
        ...(d.ultimas_ventas || []).map((venta) => [
            new Date(venta.created_at).toLocaleString("es-PE"),
            venta.codigo || "",
            venta.origen || "",
            venta.tipo || "",
            Number(venta.total || 0).toFixed(2)
        ])
    ];

    const csv = "\ufeff" + filas.map((fila) => fila.map(csvEsc).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `reporte-la-fonda-${reporteState.periodo.toLowerCase()}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
}

function configurarReporteEventos() {
    document.querySelectorAll("[data-report-period]").forEach((boton) => {
        boton.addEventListener("click", async () => {
            reporteState.periodo = boton.dataset.reportPeriod;
            document.querySelectorAll("[data-report-period]").forEach((otro) => {
                otro.classList.toggle("active", otro === boton);
            });
            await cargarReporte();
        });
    });

    document.getElementById("reporte-csv").addEventListener("click", exportarReporteCsv);
    document.getElementById("reporte-imprimir").addEventListener("click", () => window.print());
}

document.addEventListener("DOMContentLoaded", async () => {
    const Admin = ReporteAdmin();
    if (!Admin || !Admin.verificarAcceso()) return;
    configurarReporteEventos();
    await cargarReporte();
});
