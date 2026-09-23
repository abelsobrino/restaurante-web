<<<<<<< HEAD
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
=======
// ============================================================ //
// MÓDULO: MIS PEDIDOS - Sabor y Estilo
// ============================================================ //

console.log('[Mis Pedidos] Inicializando...');

function cargarPedidos() {
    return JSON.parse(localStorage.getItem('sabor_estilo_pedidos') || '[]');
}

function getCurrentUserPedidos() {
    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    if (!userData) return [];
    const todos = cargarPedidos();
    return todos.filter(p => p.email === userData.email);
}

function renderizarPedidos() {
    const container = document.getElementById('pedidos-list');
    if (!container) return;

    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');

    if (!userData) {
        container.innerHTML = `
            <div class="pedido-vacia">
                <p style="font-size: 2rem; margin-bottom: 15px;">🔒</p>
                <p style="font-size: 1.2rem; color: var(--text-gray);">Inicia sesión para ver tus pedidos</p>
                <a href="/src/modulo_auth/registrarse.html" class="btn-order" style="margin-top: 20px; display: inline-block;">Iniciar Sesión</a>
            </div>
        `;
        return;
    }

    const pedidos = getCurrentUserPedidos();

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="pedido-vacia">
                <p style="font-size: 2rem; margin-bottom: 15px;">📦</p>
                <p style="font-size: 1.2rem; color: var(--text-gray);">No tienes pedidos aún</p>
                <p style="color: var(--text-gray); font-size: 0.9rem;">¡Explora nuestra carta!</p>
                <a href="/src/modulo_menu/carta.html" class="btn-order" style="margin-top: 20px; display: inline-block;">Ver Carta</a>
            </div>
        `;
        return;
    }

    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = '<div class="pedidos-grid">';

    pedidos.forEach((pedido, index) => {
        const fecha = new Date(pedido.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const total = pedido.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const descuento = pedido.descuento || 0;
        const totalFinal = total - (total * descuento);

        html += `
            <div class="pedido-card login-card">
                <div class="pedido-header">
                    <span class="pedido-id">#${String(index + 1).padStart(4, '0')}</span>
                    <span class="pedido-fecha">${fechaFormateada}</span>
                    <span class="pedido-estado ${pedido.estado || 'completado'}">${(pedido.estado || 'Completado').toUpperCase()}</span>
                </div>
                <div class="pedido-body">
                    <div class="pedido-items">
                        ${pedido.items.map(item => `
                            <div class="pedido-item">
                                <span class="item-cantidad">${item.qty}×</span>
                                <span class="item-nombre">${item.name}</span>
                                <span class="item-precio">S/ ${(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${pedido.direccion ? `<p class="pedido-direccion"><strong>📍 Entrega:</strong> ${pedido.direccion}</p>` : ''}
                    ${pedido.tipoEntrega ? `<p class="pedido-tipo"><strong>📦 Tipo:</strong> ${pedido.tipoEntrega === 'delivery' ? 'Delivery' : 'Recojo en Tienda'}</p>` : ''}
                </div>
                <div class="pedido-footer">
                    ${descuento > 0 ? `<span class="pedido-descuento">Descuento: -${(descuento * 100)}%</span>` : ''}
                    <span class="pedido-total"><strong>Total:</strong> S/ ${totalFinal.toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
    renderizarPedidos();

    window.addEventListener('storage', function(e) {
        if (e.key === 'sabor_estilo_user' || e.key === 'sabor_estilo_pedidos') {
            renderizarPedidos();
        }
    });
});
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
