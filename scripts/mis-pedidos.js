function pEsc(v) {
  return String(v ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
async function renderizarPedidos() {
  const container = document.getElementById("pedidos-list");
  const s = LaFondaAuth.getSession();
  if (!s || s.rol !== "CLIENTE") {
    container.innerHTML = `<div class="pedido-vacia"><p style="font-size:2rem"></p><p>Inicia sesión como cliente para ver tus pedidos.</p><a class="btn-order" href="/src/modulo_auth/registrarse.html">INICIAR SESIÓN</a></div>`;
    return;
  }
  try {
    const rows = await LaFondaDB.rpc("web_mis_pedidos", {
      p_email: s.email,
      p_password: s.password,
    });
    if (!rows?.length) {
      container.innerHTML = `<div class="pedido-vacia"><p style="font-size:2rem"></p><p>Aún no tienes pedidos web registrados.</p><a class="btn-order" href="/src/modulo_menu/carta.html">VER CARTA</a></div>`;
      return;
    }
    container.innerHTML = rows
      .map(
        (p) =>
          `<div class="pedido-card login-card"><div class="pedido-header"><span class="pedido-id">${pEsc(p.codigo)}</span><span class="pedido-fecha">${new Date(p.created_at).toLocaleString("es-PE")}</span><span class="pedido-estado ${String(p.estado).toLowerCase()}">${pEsc(p.estado)}</span></div><div class="pedido-body"><div class="pedido-items">${(p.items || []).map((i) => `<div class="pedido-item"><span class="item-cantidad">${i.cantidad}×</span><span class="item-nombre">${pEsc(i.nombre)}</span><span class="item-precio">S/ ${Number(i.subtotal).toFixed(2)}</span></div>`).join("")}</div><p class="pedido-direccion"><strong>📍 Entrega:</strong> ${pEsc(p.direccion || "Recojo en tienda")}</p><p class="pedido-tipo"><strong>📦 Tipo:</strong> ${pEsc(p.tipo)}</p></div><div class="pedido-footer"><span class="pedido-descuento">Descuento: -S/ ${Number(p.descuento || 0).toFixed(2)}</span><span class="pedido-total"><strong>Total:</strong> S/ ${Number(p.total).toFixed(2)}</span></div></div>`,
      )
      .join("");
  } catch (e) {
    container.innerHTML = `<div class="pedido-vacia"><p>No se pudieron cargar tus pedidos.</p><small>${pEsc(e.message)}</small></div>`;
  }
}
document.addEventListener("DOMContentLoaded", renderizarPedidos);
