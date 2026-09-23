<<<<<<< HEAD
const state = {
  catalog: {
    categorias: [],
    platos: [],
    combos: [],
    cupones: [],
    delivery: null,
  },
  filtered: [],
  cart: [],
  category: "all",
  coupon: null,
  deliveryPoint: null,
  distanceKm: 0,
  deliveryEstimate: 0,
  map: null,
  marker: null,
};
const MAX_PER_ITEM = 10;

function toast(message, type = "success") {
  let box = document.getElementById("toast-container");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast-container";
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = type === "error" ? "custom-toast error-toast" : "custom-toast";
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
window.launchToast = toast;

function money(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}

async function loadCatalog() {
  const status = document.getElementById("catalog-status");
  try {
    state.catalog = await LaFondaDB.rpc("web_catalogo", {});
    state.filtered = [...(state.catalog.platos || [])];
    renderCategories();
    renderCatalog();
    renderCombos();
    populateCustomBases();
    setupCouponPromo();
    setupDelivery();
    status.hidden = true;
  } catch (error) {
    status.hidden = false;
    status.innerHTML = `<strong>No se pudo cargar la carta.</strong><br>${escapeHtml(error.message)}<br><small>Revisa scripts/config.js y ejecuta database/01_migracion_web.sql.</small>`;
  }
}

function renderCategories() {
  const wrap = document.getElementById("category-filters");
  wrap.innerHTML =
    `<button type="button" class="category-chip active" data-category="all">Todos</button>` +
    (state.catalog.categorias || [])
      .map(
        (c) =>
          `<button type="button" class="category-chip" data-category="${c.id}">${escapeHtml(c.nombre)}</button>`,
      )
      .join("");
  wrap.querySelectorAll(".category-chip").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.category = btn.dataset.category;
      wrap
        .querySelectorAll(".category-chip")
        .forEach((x) => x.classList.toggle("active", x === btn));
      applyFilters();
    }),
  );
}

function applyFilters() {
  const search = document
    .getElementById("filter-search")
    .value.trim()
    .toLowerCase();
  const price = document.getElementById("filter-price").value;
  const sort = document.getElementById("filter-sort").value;
  let rows = [...(state.catalog.platos || [])];
  if (state.category !== "all")
    rows = rows.filter(
      (p) => String(p.categoria_id) === String(state.category),
    );
  if (search)
    rows = rows.filter((p) =>
      `${p.nombre} ${p.descripcion || ""} ${p.categoria || ""}`
        .toLowerCase()
        .includes(search),
    );
  if (price !== "all")
    rows = rows.filter((p) => {
      const n = Number(p.precio);
      if (price === "0-15") return n < 15;
      if (price === "15-30") return n >= 15 && n <= 30;
      if (price === "30-50") return n > 30 && n <= 50;
      return n > 50;
    });
  if (sort === "price-asc")
    rows.sort((a, b) => Number(a.precio) - Number(b.precio));
  if (sort === "price-desc")
    rows.sort((a, b) => Number(b.precio) - Number(a.precio));
  if (sort === "name")
    rows.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  state.filtered = rows;
  renderCatalog();
}

function renderCatalog() {
  const grid = document.getElementById("menu-grid");
  if (!state.filtered.length) {
    grid.innerHTML = `<div class="catalog-empty">No hay platos publicados para estos filtros. Los platos sin foto permanecen pendientes en el panel Admin.</div>`;
    return;
  }
  grid.innerHTML = state.filtered
    .map(
      (p) => `
        <article class="menu-item" data-kind="PLATO" data-id="${p.id}">
            <div class="menu-img-container"><img src="${p.imagen}" alt="${escapeHtml(p.nombre)}" loading="lazy"></div>
            <div class="menu-info">
                <span class="menu-category-label">${escapeHtml(p.categoria || "")}</span>
                <h3>${escapeHtml(p.nombre)}</h3>
                <p>${escapeHtml(p.descripcion || "")}</p>
                <div class="menu-footer"><span class="price">${money(p.precio)}</span><button type="button" class="btn-add" aria-label="Agregar ${escapeHtml(p.nombre)}">+</button></div>
            </div>
        </article>`,
    )
    .join("");
  bindAddButtons(grid);
}

function renderCombos() {
  const combos = state.catalog.combos || [];
  const section = document.getElementById("combos-section");
  const grid = document.getElementById("combos-grid");
  section.hidden = combos.length === 0;
  grid.innerHTML = combos
    .map(
      (c) => `
        <article class="menu-item combo-card" data-kind="COMBO" data-id="${c.id}">
            <div class="menu-img-container"><img src="${c.imagen}" alt="${escapeHtml(c.nombre)}" loading="lazy"></div>
            <div class="menu-info"><span class="menu-category-label">COMBO</span><h3>${escapeHtml(c.nombre)}</h3>
            <p>${escapeHtml(c.descripcion || "")}</p>
            <small class="combo-components">${(c.items || []).map((i) => `${i.cantidad}× ${escapeHtml(i.nombre)}`).join(" · ")}</small>
            <div class="menu-footer"><span class="price">${money(c.precio)}</span><button type="button" class="btn-add">+</button></div></div>
        </article>`,
    )
    .join("");
  bindAddButtons(grid);
}

function bindAddButtons(root) {
  root.querySelectorAll(".menu-item .btn-add").forEach((btn) =>
    btn.addEventListener("click", () => {
      const card = btn.closest(".menu-item");
      const kind = card.dataset.kind;
      const id = Number(card.dataset.id);
      const source =
        kind === "COMBO" ? state.catalog.combos : state.catalog.platos;
      const item = source.find((x) => Number(x.id) === id);
      if (!item) return;
      addCart({
        tipo: kind,
        id,
        name: item.nombre,
        price: Number(item.precio),
        img: item.imagen,
        qty: 1,
      });
    }),
  );
}

function invalidateCoupon() {
  if (!state.coupon) return;
  state.coupon = null;
  const status = document.getElementById("coupon-status");
  if (status) {
    status.textContent =
      "Vuelve a aplicar el cupón después de modificar el carrito.";
    status.className = "coupon-error";
  }
}

function addCart(item) {
  invalidateCoupon();
  const key = `${item.tipo}:${item.id}:${item.extra || ""}`;
  const existing = state.cart.find((x) => x.key === key);
  if (existing) {
    if (existing.qty >= MAX_PER_ITEM)
      return toast(`Máximo ${MAX_PER_ITEM} unidades por producto`, "error");
    existing.qty++;
  } else state.cart.push({ ...item, key });
  toast(`Agregado: ${item.name}`);
  syncCart();
}

function syncCart() {
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = Number(state.coupon?.descuento || 0);
  const total = Math.max(0, subtotal - discount + state.deliveryEstimate);
  document.getElementById("item-count").textContent = count;
  document.getElementById("mobile-cart-badge").textContent = count;
  document.getElementById("cart-total-val").textContent = money(total);
  document.getElementById("breakdown-subtotal").textContent = money(subtotal);
  const drow = document.getElementById("breakdown-discount-row");
  drow.hidden = discount <= 0;
  document.getElementById("breakdown-discount").textContent =
    `-${money(discount)}`;
  const erow = document.getElementById("breakdown-delivery-row");
  erow.hidden = state.deliveryEstimate <= 0;
  document.getElementById("breakdown-delivery").textContent = money(
    state.deliveryEstimate,
  );

  const list = document.getElementById("cart-items-rendered-list");
  if (!state.cart.length) {
    list.innerHTML = `<div class="cart-empty">Tu carrito está vacío.</div>`;
    return;
  }
  list.innerHTML = state.cart
    .map(
      (i, index) => `
        <div class="cart-prod-row"><div class="cart-prod-meta"><img class="cart-prod-img" src="${i.img || "/assets/pagina_image/logo.webp"}" alt=""><div><strong>${escapeHtml(i.name)}</strong><small>${money(i.price)}</small></div></div>
        <div class="cart-stepper"><button type="button" data-action="minus" data-index="${index}">−</button><span>${i.qty}</span><button type="button" data-action="plus" data-index="${index}">+</button></div></div>`,
    )
    .join("");
  list.querySelectorAll("button[data-action]").forEach(
    (btn) =>
      (btn.onclick = () => {
        const i = Number(btn.dataset.index);
        invalidateCoupon();
        if (btn.dataset.action === "minus") {
          state.cart[i].qty--;
          if (state.cart[i].qty <= 0) state.cart.splice(i, 1);
        } else if (state.cart[i].qty < MAX_PER_ITEM) state.cart[i].qty++;
        syncCart();
      }),
  );
}

function populateCustomBases() {
  const select = document.getElementById("select-base");
  const plates = state.catalog.platos || [];
  select.innerHTML =
    `<option value="">Elige una base de la carta</option>` +
    plates
      .map(
        (p) =>
          `<option value="${p.id}" data-price="${p.precio}" data-image="${p.imagen}">${escapeHtml(p.nombre)} - ${money(p.precio)}</option>`,
      )
      .join("");
}

function recalcCustom() {
  const base = document.getElementById("select-base");
  const extra = document.getElementById("select-extra");
  const basePrice = Number(base.selectedOptions[0]?.dataset.price || 0);
  const extraPrice = Number(extra.selectedOptions[0]?.dataset.price || 0);
  document.getElementById("subtotal-val").textContent = (
    basePrice + extraPrice
  ).toFixed(2);
}

function setupCouponPromo() {
  const coupon = (state.catalog.cupones || [])[0];
  if (!coupon) return;
  const key = `lafonda_coupon_seen_${coupon.id}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  const overlay = document.createElement("div");
  overlay.className = "welcome-overlay";
  overlay.innerHTML = `<div class="welcome-card" style="text-align:center"><h2 style="color:var(--accent)">🔥 Promoción disponible</h2><p>${escapeHtml(coupon.descripcion || "Tenemos un cupón para ti")}</p><div class="promo-code">${escapeHtml(coupon.codigo)}</div><button class="btn-order" id="close-promo">Ver la carta</button></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#close-promo").onclick = () => overlay.remove();
}

function setupDelivery() {
  const delivery = state.catalog.delivery || {};
  if (!window.L) return;
  const start =
    delivery.latitud != null && delivery.longitud != null
      ? [Number(delivery.latitud), Number(delivery.longitud)]
      : [-12.0464, -77.0428];
  state.map = L.map("delivery-map").setView(start, 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(state.map);
  state.marker = L.marker(start, { draggable: true }).addTo(state.map);
  state.marker.on("dragend", () =>
    setDeliveryPoint(
      state.marker.getLatLng().lat,
      state.marker.getLatLng().lng,
      true,
    ),
  );
  state.map.on("click", (e) =>
    setDeliveryPoint(e.latlng.lat, e.latlng.lng, true),
  );
  toggleDelivery();
}

function haversine(a, b, c, d) {
  const R = 6371,
    rad = (x) => (x * Math.PI) / 180,
    dLat = rad(c - a),
    dLon = rad(d - b);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

async function setDeliveryPoint(lat, lng, reverse = false) {
  state.deliveryPoint = { lat, lng };
  state.marker?.setLatLng([lat, lng]);
  const cfg = state.catalog.delivery || {};
  if (cfg.latitud != null && cfg.longitud != null) {
    state.distanceKm = haversine(
      Number(cfg.latitud),
      Number(cfg.longitud),
      lat,
      lng,
    );
    state.deliveryEstimate = cfg.activo
      ? Math.max(
          Number(cfg.tarifa_minima || 0),
          state.distanceKm * Number(cfg.precio_km || 0),
        )
      : 0;
    document.getElementById("delivery-distance").textContent = cfg.activo
      ? `≈ ${state.distanceKm.toFixed(2)} km · ${money(state.deliveryEstimate)}`
      : "Delivery pendiente de configurar por Admin";
  }
  if (reverse) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=es`,
      );
      const data = await response.json();
      if (data.display_name)
        document.getElementById("customer-address").value = data.display_name;
    } catch {
      /* El pin sigue siendo válido aunque falle el nombre de calle. */
    }
  }
  syncCart();
}

function toggleDelivery() {
  const delivery =
    document.getElementById("delivery-type").value === "delivery";
  document.getElementById("address-group").hidden = !delivery;
  document.getElementById("customer-address").required = delivery;
  if (!delivery) {
    state.deliveryEstimate = 0;
    state.deliveryPoint = null;
  } else setTimeout(() => state.map?.invalidateSize(), 80);
  syncCart();
}

async function applyCoupon() {
  const code = document
    .getElementById("coupon-input")
    .value.trim()
    .toUpperCase();
  const status = document.getElementById("coupon-status");
  if (!code) {
    state.coupon = null;
    status.textContent = "";
    return syncCart();
  }
  const session = LaFondaAuth.getSession();
  if (!session || session.rol !== "CLIENTE")
    return toast("Inicia sesión como cliente para validar el cupón", "error");
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  try {
    const result = await LaFondaDB.rpc("web_validar_cupon", {
      p_email: session.email,
      p_password: session.password,
      p_codigo: code,
      p_subtotal: subtotal,
    });
    if (!result.ok) throw new Error(result.mensaje);
    state.coupon = result;
    status.className = "coupon-ok";
    status.textContent = `✓ ${result.codigo}: -${money(result.descuento)}`;
    toast("Cupón aplicado");
    syncCart();
  } catch (error) {
    state.coupon = null;
    status.className = "coupon-error";
    status.textContent = `✕ ${error.message}`;
    syncCart();
  }
}

function orderPayload() {
  return state.cart.map((i) => ({
    tipo: i.tipo,
    id: i.id,
    cantidad: i.qty,
    ...(i.extra ? { extra: i.extra } : {}),
  }));
}

async function checkout(event) {
  event.preventDefault();
  if (!state.cart.length) return toast("El carrito está vacío", "error");
  const session = LaFondaAuth.getSession();
  if (!session) {
    sessionStorage.setItem("lafonda_return_to", window.location.pathname);
    window.location.href = "/src/modulo_auth/registrarse.html";
    return;
  }
  if (session.rol !== "CLIENTE")
    return toast(
      "La vista Cliente del administrador es solo para revisar publicaciones. Para comprar usa una cuenta de cliente.",
      "error",
    );
  const deliveryType = document.getElementById("delivery-type").value;
  if (deliveryType === "delivery" && !state.deliveryPoint)
    return toast("Marca tu ubicación exacta en el mapa", "error");
  if (deliveryType === "delivery" && !state.catalog.delivery?.activo)
    return toast(
      "El delivery aún no está configurado por el administrador",
      "error",
    );
  const receipt = document.getElementById("receipt-type").value;
  if (receipt === "factura") {
    const ruc = document.getElementById("legal-ruc").value.trim();
    const company = document.getElementById("legal-company").value.trim();
    if (!/^\d{11}$/.test(ruc) || !company)
      return toast("Completa RUC de 11 dígitos y razón social", "error");
  }
  showPaymentModal(async () => {
    const button = document.querySelector(
      "#main-order-form button[type=submit]",
    );
    button.disabled = true;
    button.textContent = "Registrando pedido...";
    try {
      const result = await LaFondaDB.rpc("web_crear_pedido", {
        p_email: session.email,
        p_password: session.password,
        p_items: orderPayload(),
        p_tipo: deliveryType.toUpperCase(),
        p_direccion:
          deliveryType === "delivery"
            ? document.getElementById("customer-address").value.trim()
            : "Recojo en tienda",
        p_latitud: state.deliveryPoint?.lat ?? null,
        p_longitud: state.deliveryPoint?.lng ?? null,
        p_telefono: session.telefono || "",
        p_cupon: state.coupon?.codigo || null,
        p_observacion:
          receipt === "factura"
            ? `Factura RUC ${document.getElementById("legal-ruc").value.trim()} - ${document.getElementById("legal-company").value.trim()}`
            : "Boleta web",
      });
      renderReceipt(result, session, receipt);
      state.cart = [];
      state.coupon = null;
      state.deliveryEstimate = 0;
      syncCart();
      document.getElementById("main-order-form").reset();
      toggleDelivery();
      toast(`Pedido ${result.codigo} registrado`);
    } catch (error) {
      toast(error.message, "error");
    } finally {
      button.disabled = false;
      button.textContent = "Finalizar Pedido";
    }
  });
}

function showPaymentModal(onPay) {
  const overlay = document.createElement("div");
  overlay.className = "welcome-overlay";
  overlay.innerHTML = `<div class="welcome-card payment-card"><h3>💳 Pago web</h3><p>Simulación académica: no se envían datos a una pasarela real.</p><form id="demo-pay-form"><div class="input-group"><label>Número de tarjeta<input id="demo-card" inputmode="numeric" placeholder="4111 1111 1111 1111" required></label></div><div class="payment-two"><div class="input-group"><label>Vence<input placeholder="MM/AA" required></label></div><div class="input-group"><label>CVV<input type="password" maxlength="4" required></label></div></div><div class="payment-actions"><button type="button" class="btn-secondary" id="cancel-pay">Cancelar</button><button type="submit" class="btn-order">Pagar y registrar</button></div></form></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#cancel-pay").onclick = () => overlay.remove();
  overlay.querySelector("#demo-pay-form").onsubmit = async (e) => {
    e.preventDefault();
    const digits = overlay.querySelector("#demo-card").value.replace(/\D/g, "");
    if (digits.length !== 16)
      return toast("La tarjeta simulada debe tener 16 dígitos", "error");
    overlay.remove();
    await onPay();
  };
}

function renderReceipt(result, session, receiptType) {
  const items = state.cart
    .map(
      (i) =>
        `<tr><td>${i.qty}× ${escapeHtml(i.name)}</td><td>${money(i.price * i.qty)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${result.codigo}</title><style>body{font-family:monospace;padding:25px;color:#111}.ticket{max-width:430px;margin:auto}.center{text-align:center}table{width:100%;border-collapse:collapse}td{padding:5px 0;border-bottom:1px dashed #aaa}td:last-child{text-align:right}.total{font-size:18px;font-weight:bold}.btn{width:100%;padding:10px;margin-top:20px;background:#111;color:#fff;border:0}@media print{.btn{display:none}}</style></head><body><div class="ticket"><h2 class="center">LA FONDA</h2><p class="center">${receiptType.toUpperCase()} · ${result.codigo}</p><p>Cliente: ${escapeHtml(session.nombre)} ${escapeHtml(session.apellido || "")}</p><p>Fecha: ${new Date().toLocaleString("es-PE")}</p><table>${items}</table><p>Descuento: -${money(result.descuento)}</p><p>Delivery: ${money(result.costo_envio)}</p><p class="total">TOTAL: ${money(result.total)}</p><p>Estado: ${escapeHtml(result.estado)}</p><button class="btn" onclick="print()">IMPRIMIR COMPROBANTE</button></div></body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

async function sendSuggestion(event) {
  event.preventDefault();
  const s = LaFondaAuth.getSession();
  if (!s || s.rol !== "CLIENTE")
    return toast("Inicia sesión como cliente para enviar sugerencias", "error");
  const name = document.getElementById("suggest-name").value.trim();
  if (!name) return toast("Escribe el nombre del plato", "error");
  try {
    await LaFondaDB.rpc("web_enviar_sugerencia", {
      p_email: s.email,
      p_password: s.password,
      p_nombre: name,
      p_ingredientes: document
        .getElementById("suggest-ingredients")
        .value.trim(),
    });
    event.target.reset();
    toast("Sugerencia enviada");
  } catch (e) {
    toast(e.message, "error");
  }
}

function initEvents() {
  ["filter-search", "filter-price", "filter-sort"].forEach((id) =>
    document
      .getElementById(id)
      .addEventListener(
        id === "filter-search" ? "input" : "change",
        applyFilters,
      ),
  );
  document
    .getElementById("delivery-type")
    .addEventListener("change", toggleDelivery);
  document
    .getElementById("receipt-type")
    .addEventListener(
      "change",
      (e) =>
        (document.getElementById("ruc-group").hidden =
          e.target.value !== "factura"),
    );
  document
    .getElementById("btn-apply-coupon")
    .addEventListener("click", applyCoupon);
  document
    .getElementById("main-order-form")
    .addEventListener("submit", checkout);
  document.getElementById("mobile-cart-toggle").onclick = () =>
    document.getElementById("cart-aside").classList.toggle("mobile-open");
  document.getElementById("btn-back-to-menu").onclick = () =>
    document.getElementById("cart-aside").classList.remove("mobile-open");
  document.getElementById("btn-my-location").onclick = () => {
    if (!navigator.geolocation)
      return toast("Tu navegador no permite geolocalización", "error");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        state.map?.setView([latitude, longitude], 16);
        setDeliveryPoint(latitude, longitude, true);
      },
      (err) =>
        toast("No se pudo obtener tu ubicación: " + err.message, "error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  document
    .getElementById("select-base")
    .addEventListener("change", recalcCustom);
  document
    .getElementById("select-extra")
    .addEventListener("change", recalcCustom);
  document.getElementById("form-creacion").addEventListener("submit", (e) => {
    e.preventDefault();
    const base = document.getElementById("select-base"),
      extra = document.getElementById("select-extra");
    if (!base.value) return toast("Selecciona una base", "error");
    const p = state.catalog.platos.find(
      (x) => Number(x.id) === Number(base.value),
    );
    const extraPrice = Number(extra.selectedOptions[0].dataset.price || 0);
    const extraName = extra.options[extra.selectedIndex].text
      .split("+")[0]
      .trim();
    addCart({
      tipo: "PERSONALIZADO",
      id: Number(p.id),
      extra: extra.value,
      name: `🛠️ ${p.nombre}${extra.value !== "NINGUNO" ? ` + ${extraName}` : ""}`,
      price: Number(p.precio) + extraPrice,
      img: p.imagen,
      qty: 1,
    });
  });
  document
    .getElementById("form-sugerencia")
    .addEventListener("submit", sendSuggestion);
}

document.addEventListener("DOMContentLoaded", async () => {
  initEvents();
  const session = LaFondaAuth.getSession();
  if (session?.rol === "CLIENTE")
    document.getElementById("customer-name").value =
      `${session.nombre || ""} ${session.apellido || ""}`.trim();
  syncCart();
  await loadCatalog();
});
=======
// ============================================================ //
// FUNCIONES DE SEGURIDAD PARA LOGIN
// ============================================================ //

function requireLogin() {
    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    if (!userData?.nombre) {
        if (typeof launchToast === 'function') {
            launchToast('⚠️ Por favor, inicia sesión para continuar', 'error');
        } else {
            alert('Por favor, inicia sesión para continuar');
        }
        setTimeout(() => {
            window.location.href = '/src/modulo_auth/registrarse.html';
        }, 1500);
        return false;
    }
    return true;
}

function guardarPedidoEnHistorial(items, total, descuento, direccion, tipoEntrega) {
    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    if (!userData) return;
    
    let pedidos = [];
    try {
        const stored = localStorage.getItem('sabor_estilo_pedidos');
        if (stored) {
            pedidos = JSON.parse(stored);
        }
    } catch (e) {
        console.warn('[Pedidos] Error al leer:', e);
        pedidos = [];
    }
    
    const nuevoPedido = {
        email: userData.email,
        nombre: userData.nombre,
        items: items.map(item => ({
            name: item.name,
            price: item.price,
            qty: item.qty
        })),
        total: total,
        descuento: descuento,
        direccion: direccion || 'Recojo en Tienda',
        tipoEntrega: tipoEntrega || 'recojo',
        estado: 'completado',
        fecha: new Date().toISOString()
    };
    
    pedidos.push(nuevoPedido);
    localStorage.setItem('sabor_estilo_pedidos', JSON.stringify(pedidos));
    console.log('[Pedidos] ✅ Guardado exitosamente para:', userData.nombre);
    console.log('[Pedidos] Total de pedidos:', pedidos.length);
    return nuevoPedido;
}

// ============================================================ //
// VARIABLES GLOBALES DEL CARRITO
// ============================================================ //

let cartArray = [];
const MAX_PER_ITEM = 10;
let activeDiscount = 0;
let appliedCouponName = "";
const DEFAULT_ITEM_IMG = "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=80&auto=format&fit=crop";

// ============================================================ //
// FUNCIÓN DE TOASTS
// ============================================================ //

function launchToast(message, type = "success") {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = type === "error" ? "custom-toast error-toast" : "custom-toast";
    toast.innerText = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastFadeOut 0.3s ease forwards";
        setTimeout(() => toast.remove(), 300);
    }, 2200);
}

console.log("[Sistema] Inicializando Carrito de Compras de Sabor y Estilo...");

// ============================================================ //
// MOSTRAR USUARIO LOGUEADO
// ============================================================ //
function mostrarUsuarioLogueado() {
    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    if (userData?.nombre) {
        console.log('[Sistema] Usuario logueado:', userData.nombre);
        const nombreInput = document.getElementById('customer-name');
        if (nombreInput && !nombreInput.value) {
            nombreInput.value = userData.nombre;
        }
        return true;
    }
    return false;
}

// ============================================================ //
// POP-UP DE BIENVENIDA
// ============================================================ //

(function injectWelcomeModal() {
    const welcomeOverlay = document.createElement("div");
    welcomeOverlay.id = "welcome-overlay";
    welcomeOverlay.className = "welcome-overlay";
    welcomeOverlay.innerHTML = `
        <div class="welcome-card" id="welcome-card-content" style="text-align: center;">
            <h2 style="color: #ffb400; margin-bottom: 12px;">🍕 ¡Bienvenidos a Sabor y Estilo!</h2>
            <p style="font-size: 0.95rem; line-height: 1.5; color: #ccc; margin-bottom: 15px;">
                Disfruta de la mejor combinación de ingredientes artesanales y pasión culinaria.
            </p>
            <div style="background: rgba(255,180,0,0.1); padding: 15px; border-radius: 8px; font-size: 0.9rem; border: 1px dashed #ffb400; margin-bottom: 20px; color: #ffb400;">
                <strong>🔥 CUPÓN DE BIENVENIDA:</strong> Usa el código <strong>PIZZA20</strong> para obtener un 20% de descuento.
            </div>
            <button id="btn-close-welcome" style="width: 100%; background: #ffb400; color: #000; border: none; padding: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; text-transform: uppercase;">Ver la Carta</button>
        </div>
    `;
    document.body.appendChild(welcomeOverlay);
    document.getElementById("btn-close-welcome").addEventListener("click", () => welcomeOverlay.remove());
})();

// ============================================================ //
// INYECCIÓN DE BURBUJA DE SOPORTE
// ============================================================ //

(function injectFloatingContactBtn() {
    if (document.querySelector(".floating-support-btn")) return;

    const contactBtn = document.createElement("a");
    contactBtn.href = "/src/modulo_feedback/contactanos.html";
    contactBtn.className = "floating-support-btn";
    contactBtn.setAttribute("title", "Contactar con Soporte");
    
    contactBtn.innerHTML = `
        <span class="support-icon">📞</span>
        <span class="support-text">Soporte</span>
    `;
    document.body.appendChild(contactBtn);
})();

// ============================================================ //
// MAPEO DE ELEMENTOS DE INTERFAZ
// ============================================================ //

const menuItems = document.querySelectorAll(".menu-item");
const selectBase = document.getElementById("select-base");
const selectExtra = document.getElementById("select-extra");
const subtotalVal = document.getElementById("subtotal-val");
const formCreacion = document.getElementById("form-creacion");
const orderDetails = document.getElementById("order-details");
const itemCount = document.getElementById("item-count");
const mobileCartBadge = document.getElementById("mobile-cart-badge");
const cartTotalVal = document.getElementById("cart-total-val");
const mobileCartToggle = document.getElementById("mobile-cart-toggle");
const cartAside = document.getElementById("cart-aside");
const mainOrderForm = document.querySelector(".pedido-sidebar form");

let deliverySelect, addressGroup, addressInput, receiptTypeSelect, rucGroup, rucInput, companyInput;

// ============================================================ //
// INYECCIÓN DE LOGÍSTICA, SUNAT Y CAMPOS REQUERIDOS
// ============================================================ //

(function injectBusinessInputs() {
    if (!mainOrderForm) return;

    const backButtonHtml = `
        <button type="button" id="btn-back-to-menu" class="btn-close-cart" style="display: none;">✕</button>
    `;

    const businessHtml = `
        <div class="input-group" style="margin-top: 15px;">
            <label>Tipo de Entrega</label>
            <select id="delivery-type">
                <option value="delivery">📍 Delivery a Domicilio</option>
                <option value="recojo">🏪 Recojo en Tienda</option>
            </select>
        </div>
        <div class="input-group" id="address-group" style="margin-top: 15px;">
            <label>Dirección de Envío</label>
            <input type="text" id="customer-address" placeholder="Ej: Av. Los Sauces 456" required />
        </div>
        <div class="input-group" style="margin-top: 15px;">
            <label>Tipo de Comprobante</label>
            <select id="receipt-type">
                <option value="boleta">📄 Boleta de Venta (DNI)</option>
                <option value="factura">🏢 Factura (RUC)</option>
            </select>
        </div>
        <div id="ruc-group" style="display: none; margin-top: 10px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; border: 1px solid #333;">
            <div class="input-group" style="margin-bottom: 10px;">
                <label style="font-size:0.75rem;">Número de RUC</label>
                <input type="text" id="legal-ruc" placeholder="Ej: 20601234567" pattern="[0-9]{11}" title="El RUC debe tener 11 dígitos numéricos." />
            </div>
            <div class="input-group">
                <label style="font-size:0.75rem;">Razón Social</label>
                <input type="text" id="legal-company" placeholder="Ej: Pizza & Gourmet S.A.C." />
            </div>
        </div>
        <label style="margin-top: 15px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: var(--text-gray); display:block;">Productos Añadidos</label>
        <div class="cart-items-container" id="cart-items-rendered-list" style="max-height: 260px; overflow-y: auto;"></div>
        <div class="coupon-container" style="margin-top: 15px; padding: 10px; background: #1a1a1a; border-radius: 6px; border: 1px solid #333;">
            <div style="display: flex; gap: 8px;">
                <input type="text" id="coupon-input" placeholder="CUPÓN" style="flex: 1; padding: 6px 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 0.85rem; text-transform: uppercase;">
                <button type="button" id="btn-apply-coupon" style="background: #ffb400; color: #000; border: none; padding: 6px 12px; font-weight: bold; border-radius: 4px; cursor: pointer;">Aplicar</button>
            </div>
            <div id="coupon-status" style="font-size: 0.75rem; margin-top: 5px; font-weight: 600;"></div>
        </div>
        <div class="price-breakdown" style="margin-top: 15px; padding: 12px; background: #161616; border-radius: 6px; font-size: 0.85rem; border: 1px solid #222;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #aaa;">
                <span>Monto Bruto:</span>
                <span id="breakdown-subtotal">S/ 0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #ff3333; display: none;" id="breakdown-discount-row">
                <span>Descuento Aplicado:</span>
                <span id="breakdown-discount">-S/ 0.00</span>
            </div>
        </div>
    `;
    
    if (orderDetails) {
        orderDetails.parentElement.style.display = "none";
        orderDetails.removeAttribute("required");
        mainOrderForm.insertAdjacentHTML("afterbegin", backButtonHtml);
        orderDetails.parentElement.insertAdjacentHTML("beforebegin", businessHtml);
    }

    deliverySelect = document.getElementById("delivery-type");
    addressGroup = document.getElementById("address-group");
    addressInput = document.getElementById("customer-address");
    receiptTypeSelect = document.getElementById("receipt-type");
    rucGroup = document.getElementById("ruc-group");
    rucInput = document.getElementById("legal-ruc");
    companyInput = document.getElementById("legal-company");

    const backBtn = document.getElementById("btn-back-to-menu");
    if(backBtn) {
        if (window.innerWidth <= 992) backBtn.style.display = "flex";
        window.addEventListener("resize", () => {
            backBtn.style.display = window.innerWidth <= 992 ? "flex" : "none";
        });
        backBtn.addEventListener("click", () => {
            cartAside?.classList.remove("mobile-open");
        });
    }

    if (deliverySelect) {
        deliverySelect.addEventListener("change", () => {
            if (deliverySelect.value === "recojo") {
                addressGroup.style.display = "none";
                addressInput.removeAttribute("required");
                addressInput.value = "Recojo en Tienda";
            } else {
                addressGroup.style.display = "block";
                addressInput.setAttribute("required", "true");
                addressInput.value = "";
            }
        });
    }

    if (receiptTypeSelect) {
        receiptTypeSelect.addEventListener("change", () => {
            if (receiptTypeSelect.value === "factura") {
                rucGroup.style.display = "block";
                rucInput.setAttribute("required", "true");
                companyInput.setAttribute("required", "true");
            } else {
                rucGroup.style.display = "none";
                rucInput.removeAttribute("required");
                companyInput.removeAttribute("required");
                rucInput.value = "";
                companyInput.value = "";
            }
        });
    }

    document.getElementById("btn-apply-coupon").addEventListener("click", () => {
        const code = document.getElementById("coupon-input").value.trim().toUpperCase();
        const statusEl = document.getElementById("coupon-status");
        if (code === "PIZZA20") {
            activeDiscount = 0.20;
            appliedCouponName = "PIZZA20";
            statusEl.style.color = "#00a650";
            statusEl.innerText = "✓ Cupón Aplicado (20%)";
            launchToast("¡Cupón aplicado con éxito!");
        } else {
            activeDiscount = 0;
            appliedCouponName = "";
            statusEl.style.color = "#ff3333";
            statusEl.innerText = "✕ Inválido";
            launchToast("Cupón inválido o expirado", "error");
        }
        syncCartView();
    });
})();

// ============================================================ //
// RENDERIZADO DEL CARRITO
// ============================================================ //

function syncCartView() {
    const totalUnidades = cartArray.reduce((sum, item) => sum + item.qty, 0);
    const rawSubtotal = cartArray.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmount = rawSubtotal * activeDiscount;
    const totalDinero = rawSubtotal - discountAmount;

    if (itemCount) itemCount.innerText = totalUnidades;
    if (mobileCartBadge) mobileCartBadge.innerText = totalUnidades;
    if (cartTotalVal) cartTotalVal.innerText = `S/ ${totalDinero.toFixed(2)}`;

    document.getElementById("breakdown-subtotal").innerText = `S/ ${rawSubtotal.toFixed(2)}`;
    const discountRow = document.getElementById("breakdown-discount-row");
    if (activeDiscount > 0) {
        discountRow.style.display = "flex";
        document.getElementById("breakdown-discount").innerText = `-S/ ${discountAmount.toFixed(2)}`;
    } else {
        discountRow.style.display = "none";
    }

    const renderedList = document.getElementById("cart-items-rendered-list");
    if (renderedList) {
        renderedList.innerHTML = "";
        if (cartArray.length === 0) {
            renderedList.innerHTML = `<div style="text-align:center; padding:15px; color:#777; font-size:0.85rem;">Tu carrito está vacío.</div>`;
        } else {
            cartArray.forEach((item, index) => {
                const row = document.createElement("div");
                row.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:#222; padding:8px; border-radius:6px; border:1px solid #2e2e2e; gap:10px;";
                row.innerHTML = `
                    <img src="${item.img || DEFAULT_ITEM_IMG}" alt="item" style="width:40px; height:40px; border-radius:4px; object-fit:cover; border:1px solid #444;">
                    <div style="flex:1;">
                        <strong style="color:#fff; font-size:0.85rem; display:block;">${item.name}</strong>
                        <span style="font-size:0.75rem; color:#aaa;">${item.qty} x S/ ${item.price.toFixed(2)}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:5px;">
                        <button type="button" class="minus-btn" data-index="${index}" style="background:#333; color:#fff; border:none; width:22px; height:22px; border-radius:4px; font-weight:bold; cursor:pointer;">-</button>
                        <span style="color:#fff; font-weight:bold; min-width:15px; text-align:center; font-size:0.85rem;">${item.qty}</span>
                        <button type="button" class="plus-btn" data-index="${index}" style="background:#333; color:#fff; border:none; width:22px; height:22px; border-radius:4px; font-weight:bold; cursor:pointer;">+</button>
                    </div>
                `;
                row.querySelector(".minus-btn").addEventListener("click", () => {
                    if (cartArray[index].qty > 1) cartArray[index].qty--;
                    else cartArray.splice(index, 1);
                    syncCartView();
                });
                
                row.querySelector(".plus-btn").addEventListener("click", () => {
                    if (cartArray[index].qty < MAX_PER_ITEM) {
                        cartArray[index].qty++;
                    } else {
                        launchToast(`Máximo permitido: ${MAX_PER_ITEM} unidades por producto`, "error");
                    }
                    syncCartView();
                });
                renderedList.appendChild(row);
            });
        }
    }
}

// ============================================================ //
// AÑADIR DESDE LA CARTA TRADICIONAL
// ============================================================ //
menuItems.forEach((article) => {
    const btnAdd = article.querySelector(".btn-add");
    if (btnAdd) {
        btnAdd.addEventListener("click", () => {
            const title = article.querySelector("h3").innerText;
            const priceText = article.querySelector(".price").innerText;
            const imgEl = article.querySelector("img");
            const imgSrc = imgEl ? imgEl.src : DEFAULT_ITEM_IMG;
            const numericalPrice = Number.parseFloat(priceText.replace(/[^0-9.]/g, ""));
            const existingItem = cartArray.find(item => item.name === title);
            
            if (existingItem) {
                if (existingItem.qty < MAX_PER_ITEM) {
                    existingItem.qty++;
                    launchToast(`Agregado: ${title}`);
                } else {
                    launchToast(`Máximo permitido: ${MAX_PER_ITEM} unidades por producto`, "error");
                }
            } else {
                cartArray.push({ name: title, price: numericalPrice, qty: 1, img: imgSrc });
                launchToast(`Agregado: ${title}`);
            }
            syncCartView();
        });
    }
});

// ============================================================ //
// LÓGICA: ARMA TU PEDIDO
// ============================================================ //
function recalculateSubtotal() {
    if (!selectBase || !selectExtra || !subtotalVal) return;
    const base = Number.parseFloat(selectBase.value) || 0;
    const extra = Number.parseFloat(selectExtra.value) || 0;
    subtotalVal.innerText = (base + extra).toFixed(2);
}

/// ============================================================ //
// FUNCIONES EXTRAS PARA REDUCIR COMPLEJIDAD COGNITIVA
// ============================================================ //

// Función para obtener el precio actual
function obtenerPrecioActual(subtotalVal) {
    return Number.parseFloat(subtotalVal.innerText) || 0;
}

// Función para validar la selección de base
function validarSeleccionBase(selectBase, subtotalVal) {
    const currentPrice = obtenerPrecioActual(subtotalVal);
    if (selectBase.value === "0" || currentPrice <= 0) {
        if (typeof launchToast === "function") {
            launchToast("Por favor, selecciona una base válida.", "error");
        } else {
            alert("Por favor, selecciona una base válida.");
        }
        return false;
    }
    return true;
}

// Función para limpiar texto de opción
function limpiarTextoOpcion(texto) {
    return texto.includes("-") ? texto.split("-")[0].trim() : texto.trim();
}

// Función para obtener nombre de la base
function obtenerNombreBase(selectBase) {
    const rawBaseText = selectBase.options[selectBase.selectedIndex].text;
    return limpiarTextoOpcion(rawBaseText);
}

// Función para obtener nombre del extra
function obtenerNombreExtra(selectExtra) {
    if (!selectExtra || selectExtra.selectedIndex <= 0) {
        return "";
    }
    const rawExtraText = selectExtra.options[selectExtra.selectedIndex].text;
    const cleanExtra = limpiarTextoOpcion(rawExtraText);
    return ` + ${cleanExtra}`;
}

// Función para crear título personalizado
function crearTituloPersonalizado(selectBase, selectExtra) {
    const nameBase = obtenerNombreBase(selectBase);
    const nameExtra = obtenerNombreExtra(selectExtra);
    return `🛠️ Personalizado: ${nameBase}${nameExtra}`;
}

// Función para agregar o actualizar item en el carrito (CORREGIDA)
function agregarOActualizarItemPersonalizado(customTitle, currentPrice) {
    const existingCustom = cartArray.find(item => item.name === customTitle);
    
    if (existingCustom) {
        if (existingCustom.qty < MAX_PER_ITEM) {
            existingCustom.qty++;
            if (typeof launchToast === "function") {
                launchToast("¡Pedido personalizado actualizado!");
            }
        } else if (typeof launchToast === "function") {
            launchToast(`Máximo permitido: ${MAX_PER_ITEM} unidades`, "error");
        }
    } else {
        cartArray.push({
            name: customTitle,
            price: currentPrice,
            qty: 1,
            img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=80&auto=format&fit=crop"
        });
        if (typeof launchToast === "function") {
            launchToast("¡Pedido personalizado añadido!");
        }
    }
}

// Función para resetear el formulario personalizado
function resetearFormularioPersonalizado(formCreacion, subtotalVal) {
    formCreacion.reset();
    subtotalVal.innerText = "0.00";
}

// Función para notificar cambios al carrito
function notificarCambioCarrito() {
    if (typeof syncCartView === "function") {
        syncCartView();
    }
}
//Función principal del submit (refactorizada)
function manejarSubmitPersonalizado(e) {
    e.preventDefault();
    
    // Validar login
    if (!requireLogin()) {
        return;
    }
    
    // Validar selección de base
    if (!validarSeleccionBase(selectBase, subtotalVal)) {
        return;
    }
    
    // Obtener datos
    const currentPrice = obtenerPrecioActual(subtotalVal);
    const customTitle = crearTituloPersonalizado(selectBase, selectExtra);
    
    // Agregar o actualizar en carrito
    agregarOActualizarItemPersonalizado(customTitle, currentPrice);
    
    // Resetear y actualizar
    resetearFormularioPersonalizado(formCreacion, subtotalVal);
    notificarCambioCarrito();
}

// ============================================================ //
// INICIALIZACIÓN DE EVENTOS
// ============================================================ //

// Eventos de cambio en selects
if (selectBase) selectBase.addEventListener("change", recalculateSubtotal);
if (selectExtra) selectExtra.addEventListener("change", recalculateSubtotal);

// Evento de submit del formulario personalizado
if (formCreacion) {
    formCreacion.addEventListener("submit", manejarSubmitPersonalizado);
}

// ============================================================ //
// PROCESAR "PROPÓN UN NUEVO PLATO"
// ============================================================ //

const formSugerencia = document.getElementById("form-sugerencia");
const btnSendSuggest = document.getElementById("btn-send-suggest");

if (btnSendSuggest && formSugerencia) {
    btnSendSuggest.addEventListener("click", () => {
        const suggestNameInput = document.getElementById("suggest-name");
        const sugerenciaNombre = suggestNameInput ? suggestNameInput.value.trim() : "";

        if (sugerenciaNombre === "") {
            if (typeof launchToast === "function") {
                launchToast("Por favor, escribe el nombre del plato soñado.", "error");
            } else {
                alert("Por favor, escribe el nombre del plato soñado.");
            }
            return;
        }

        if (typeof launchToast === "function") {
            launchToast("¡Sugerencia enviada con éxito! :)");
        } else {
            alert("Sugerencia enviada :)");
        }
        
        formSugerencia.reset();
    });
}

// ============================================================ //
// CONTROL LATERAL DEL CARRITO MÓVIL
// ============================================================ //

if (mobileCartToggle) {
    mobileCartToggle.addEventListener("click", () => cartAside?.classList.toggle("mobile-open"));
}
// ============================================================ //
// VENTANA DE CALIFICACIÓN FLOTANTE
// ============================================================ //

// Constantes para almacenamiento
const REVIEW_STORAGE_KEY = 'sabor_estilo_review_preference';
const REVIEW_SESSION_KEY = 'sabor_estilo_review_shown';

// Función para verificar si ya se mostró la review en esta sesión
function reviewShownInSession() {
    return sessionStorage.getItem(REVIEW_SESSION_KEY) === 'true';
}

// Función para guardar preferencia del usuario
function guardarPreferenciaReview(accion) {
    const data = {
        accion: accion, // 'rated', 'later', 'never'
        fecha: new Date().toISOString(),
        timestamp: Date.now()
    };
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(data));
    console.log('[Review] Preferencia guardada:', accion);
}

// Función para verificar si debemos mostrar la review
function debeMostrarReview() {
    // Si ya se mostró en esta sesión, no mostrar
    if (reviewShownInSession()) {
        console.log('[Review] Ya se mostró en esta sesión');
        return false;
    }
    
    // Verificar preferencia guardada
    const preferencia = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!preferencia) {
        return true;
    }
    
    try {
        const data = JSON.parse(preferencia);
        
        // Si dijo "never", no mostrar nunca
        if (data.accion === 'never') {
            console.log('[Review] Usuario prefirió no mostrar nunca');
            return false;
        }
        
        // Si dijo "later" y pasaron más de 7 días, mostrar
        if (data.accion === 'later') {
            const diasPasados = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
            if (diasPasados > 7) {
                console.log('[Review] Pasaron más de 7 días, mostrar nuevamente');
                return true;
            }
            console.log('[Review] Usuario pidió recordatorio en menos de 7 días');
            return false;
        }
        
        // Si dijo "rated", esperar 30 días antes de volver a preguntar
        if (data.accion === 'rated') {
            const diasPasados = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
            if (diasPasados > 30) {
                console.log('[Review] Pasaron más de 30 días desde la última calificación');
                return true;
            }
            console.log('[Review] Usuario ya calificó recientemente');
            return false;
        }
        
        return true;
    } catch (error) {
        console.warn('[Review] Error al leer preferencia:', error);
        return true;
    }
}

// Función para marcar que ya se mostró en esta sesión
function marcarReviewMostrada() {
    sessionStorage.setItem(REVIEW_SESSION_KEY, 'true');
}

function triggerReviewModal() {
    // Verificar si debemos mostrar la review
    if (!debeMostrarReview()) {
        console.log('[Review] Condiciones no cumplidas para mostrar review');
        return;
    }
    
    console.log('[Review] Mostrando ventana de calificación');
    
    const reviewOverlay = document.createElement("div");
    reviewOverlay.className = "welcome-overlay";
    reviewOverlay.style.zIndex = "6000";
    reviewOverlay.style.animation = "fadeIn 0.3s ease-out";
    reviewOverlay.innerHTML = `
        <div class="welcome-card" style="text-align: center; border-color: #ffb400; animation: slideUp 0.4s ease-out; max-width: 420px;">
            <div style="font-size: 3rem; margin-bottom: 10px;">⭐</div>
            <h3 style="color: #ffb400; margin-bottom: 12px; font-size: 1.3rem;">¡Tu opinión nos importa!</h3>
            <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 20px; line-height: 1.5;">
                ¿Te gustaría tomarnos un minuto para calificar tu experiencia de compra en <strong>Sabor y Estilo</strong>?
            </p>
            <p style="font-size: 0.8rem; color: #888; margin-bottom: 18px;">
                ⏱️ Solo te tomará 1 minuto
            </p>
            <div style="display:flex; flex-direction:column; gap:10px; width: 100%;">
                <button id="btn-rate-now" style="background: #ffb400; color:#000; font-weight:bold; border:none; padding:12px; border-radius:8px; cursor:pointer; transition: all 0.2s; font-size: 1rem; width: 100%;" 
                        onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    ⭐ Sí, calificar ahora
                </button>
                <button id="btn-rate-later" style="background: rgba(255,255,255,0.08); color:#fff; border:1px solid #444; padding:10px; border-radius:8px; cursor:pointer; transition: all 0.2s; width: 100%;"
                        onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
                    ⏰ Más tarde
                </button>
                <button id="btn-rate-never" style="background: transparent; color:#666; border:none; padding:8px; font-size:0.8rem; cursor:pointer; text-decoration:underline; width: 100%;"
                        onmouseover="this.style.color='#888'" onmouseout="this.style.color='#666'">
                    ❌ No volver a preguntar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(reviewOverlay);
    
    // Marcar como mostrada en sesión
    marcarReviewMostrada();

    // Evento: Calificar ahora
    document.getElementById("btn-rate-now").addEventListener("click", () => {
        reviewOverlay.remove();
        guardarPreferenciaReview('rated');
        launchToast("⭐ ¡Gracias por calificarnos!");
        setTimeout(() => {
            window.location.href = "/src/modulo_feedback/resenas.html";
        }, 500);
    });
    
    // Evento: Más tarde
    document.getElementById("btn-rate-later").addEventListener("click", () => {
        reviewOverlay.remove();
        guardarPreferenciaReview('later');
        launchToast("📅 Te lo recordaremos en tu próxima visita");
    });
    
    // Evento: No volver a preguntar
    document.getElementById("btn-rate-never").addEventListener("click", () => {
        reviewOverlay.remove();
        guardarPreferenciaReview('never');
        launchToast("✅ Entendido, no volveremos a preguntar");
    });
    
    // Cerrar al hacer clic fuera (mejora UX)
    reviewOverlay.addEventListener("click", (e) => {
        if (e.target === reviewOverlay) {
            reviewOverlay.remove();
            launchToast("📅 Puedes calificarnos cuando quieras en la sección Reseñas");
        }
    });
}

// ============================================================ //
// FUNCIÓN PARA FORZAR MOSTRAR REVIEW (DESDE CONSOLA)
// ============================================================ //

function forceReviewModal() {
    sessionStorage.removeItem(REVIEW_SESSION_KEY);
    triggerReviewModal();
}
// ============================================================ //
// FUNCIONES DE FORMATEO DE TARJETA
// ============================================================ //

function formatearNumeroTarjeta(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 16) valor = valor.slice(0, 16);
    let valorFormateado = '';
    for (let i = 0; i < valor.length; i++) {
        if (i > 0 && i % 4 === 0) valorFormateado += ' ';
        valorFormateado += valor[i];
    }
    input.value = valorFormateado;
}

function formatearFechaTarjeta(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 4) valor = valor.slice(0, 4);
    if (valor.length >= 2) {
        const mes = Number.parseInt(valor.slice(0, 2));
        if (mes > 12) valor = '12' + valor.slice(2);
        if (mes === 0) valor = '1' + valor.slice(1);
    }
    let valorFormateado = '';
    for (let i = 0; i < valor.length; i++) {
        if (i === 2 && valor.length > 2) valorFormateado += '/';
        valorFormateado += valor[i];
    }
    input.value = valorFormateado;
}

function validarNumeroTarjeta(input) {
    const valor = input.value.replace(/\s/g, '');
    return valor.length === 16;
}function validarFechaTarjeta(input) {
    const valor = input.value.replaceAll('/', '');
    if (valor.length !== 4) return false;
    const mes = Number.parseInt(valor.slice(0, 2));
    const anio = Number.parseInt(valor.slice(2, 4));
    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear() % 100;
    if (mes < 1 || mes > 12) return false;
    if (anio < anioActual) return false;
    if (anio === anioActual) {
        const mesActual = fechaActual.getMonth() + 1;
        if (mes < mesActual) return false;
    }
    return true;
}

function validarCvv(input) {
    const valor = input.value.replace(/\D/g, '');
    return valor.length >= 3 && valor.length <= 4;
}

function validarNombreTitular(input) {
    return input.value.trim().length >= 3;
}

function validarCarritoVacio(cartArray) {
    if (cartArray.length === 0) {
        launchToast("El carrito está vacío", "error");
        console.log('[Pedido] Carrito vacío.');
        return false;
    }
    return true;
}

function obtenerYValidarNombreCliente(clientNameInput) {
    let clientName = clientNameInput ? clientNameInput.value.trim() : "";
    if (!clientName) {
        const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
        if (userData?.nombre) {
            clientName = userData.nombre;
            if (clientNameInput) {
                clientNameInput.value = clientName;
            }
            console.log('[Pedido] Nombre auto-completado desde login:', clientName);
        }
    }
    if (!clientName) {
        launchToast("Por favor, ingresa tu nombre en el campo correspondiente", "error");
        if (clientNameInput) {
            clientNameInput.focus();
            clientNameInput.style.borderColor = "#ff3333";
            setTimeout(function() {
                clientNameInput.style.borderColor = "";
            }, 3000);
        }
        console.log('[Pedido] Error: Nombre del cliente vacío.');
        return null;
    }
    console.log('[Pedido] Cliente:', clientName);
    return clientName;
}

function obtenerDatosPedido(receiptTypeSelect, rucInput, companyInput, deliverySelect, addressInput) {
    const docType = receiptTypeSelect ? receiptTypeSelect.value : "boleta";
    const rucVal = rucInput ? rucInput.value.trim() : "";
    const companyVal = companyInput ? companyInput.value.trim() : "";
    const deliveryType = deliverySelect ? deliverySelect.value : "recojo";
    const addressVal = addressInput ? addressInput.value.trim() : "";
    return { docType, rucVal, companyVal, deliveryType, addressVal };
}

function calcularTotalesPedido(cartArray, activeDiscount) {
    const rawSubtotal = cartArray.reduce(function(sum, item) {
        return sum + (item.price * item.qty);
    }, 0);
    const discountAmount = rawSubtotal * activeDiscount;
    const totalFinal = rawSubtotal - discountAmount;
    console.log('[Pedido] Subtotal:', rawSubtotal);
    console.log('[Pedido] Descuento:', discountAmount);
    console.log('[Pedido] Total final:', totalFinal);
    return { rawSubtotal, discountAmount, totalFinal };
}

function generarIdDocumento(docType) {
    const randomNum = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000).padStart(6, '0');
    return (docType === "factura" ? "FFF" : "BBB") + "-" + randomNum;
}

function obtenerDatosTicket(ticketInfo) {
    const fecha = new Date();
    return {
        fecha,
        currentDate: fecha.toLocaleDateString(),
        currentTime: fecha.toLocaleTimeString(),
        docType: ticketInfo.docType,
        fullDocumentId: ticketInfo.fullDocumentId,
        clientName: ticketInfo.clientName,
        companyVal: ticketInfo.companyVal,
        rucVal: ticketInfo.rucVal,
        deliveryType: ticketInfo.deliveryType,
        addressVal: ticketInfo.addressVal,
        cartArray: ticketInfo.cartArray,
        totalFinal: ticketInfo.totalFinal,
        discountAmount: ticketInfo.discountAmount,
        activeDiscount: ticketInfo.activeDiscount
    };
}

function generarTicketHTML(datos) {
    const { docType, fullDocumentId, clientName, companyVal, rucVal, deliveryType, addressVal, cartArray, totalFinal, discountAmount, activeDiscount, currentDate, currentTime } = datos;
    const itemsHtml = cartArray.map(function(i) {
        return '<li class="flex-space" style="margin-bottom: 5px;">' +
            '<span>' + i.qty + ' x ' + i.name + '</span>' +
            '<span>S/ ' + (i.price * i.qty).toFixed(2) + '</span>' +
        '</li>';
    }).join('');
    return '<html>' +
        '<head>' +
            '<title>' + docType.toUpperCase() + ' - ' + fullDocumentId + '</title>' +
            '<style>' +
                'body { font-family: "Courier New", Courier, monospace; margin: 0; padding: 10px; color: #000; font-size: 13px; }' +
                '.ticket { max-width: 380px; margin: auto; padding: 10px; }' +
                '.center { text-align: center; }' +
                '.bold { font-weight: bold; }' +
                '.separator { border-top: 1px dashed #000; margin: 10px 0; }' +
                '.flex-space { display: flex; justify-content: space-between; }' +
                '.items-list { padding: 0; list-style: none; margin: 5px 0; }' +
                '.btn-print { width: 100%; padding: 10px; background: #000; color: #fff; border: none; font-weight: bold; cursor: pointer; margin-top: 15px; font-family: inherit; }' +
                '@media print { .btn-print { display: none; } }' +
            '</style>' +
        '</head>' +
        '<body>' +
            '<div class="ticket">' +
                '<h2 class="center" style="margin-bottom: 4px;">🍕 SABOR Y ESTILO</h2>' +
                '<p class="center" style="margin-top: 0; font-size: 11px;">SABOR Y ESTILO S.A.C.<br>AV. CENTRAL 123 - LIMA</p>' +
                '<div class="separator"></div>' +
                '<p class="bold center" style="font-size: 14px; margin: 5px 0;">' + docType.toUpperCase() + ' ELECTRÓNICA</p>' +
                '<p class="center" style="margin: 0;"><b>SERIE:</b> ' + fullDocumentId + '</p>' +
                '<div class="separator"></div>' +
                '<p><b>FECHA EMISIÓN:</b> ' + currentDate + ' ' + currentTime + '</p>' +
                '<p><b>CLIENTE:</b> ' + (docType === "factura" ? companyVal : clientName) + '</p>' +
                (docType === "factura" ? '<p><b>RUC:</b> ' + rucVal + '</p>' : "") +
                '<p><b>ENTREGA:</b> ' + (deliveryType === "recojo" ? "Recojo en Tienda" : "Delivery") + '</p>' +
                (deliveryType === "delivery" ? '<p><b>DIRECCIÓN:</b> ' + addressVal + '</p>' : "") +
                '<div class="separator"></div>' +
                '<p class="bold">DETALLE DEL PEDIDO:</p>' +
                '<ul class="items-list">' + itemsHtml + '</ul>' +
                '<div class="separator"></div>' +
                '<div class="flex-space"><span>OP. GRAVADA:</span><span>S/ ' + (totalFinal / 1.18).toFixed(2) + '</span></div>' +
                '<div class="flex-space"><span>I.G.V. (18%):</span><span>S/ ' + (totalFinal - (totalFinal / 1.18)).toFixed(2) + '</span></div>' +
                (activeDiscount > 0 ? '<div class="flex-space" style="color: red;"><span>DSCTO APLICADO:</span><span>-S/ ' + discountAmount.toFixed(2) + '</span></div>' : "") +
                '<div class="flex-space bold" style="font-size: 15px; margin-top: 5px;"><span>TOTAL A PAGAR:</span><span>S/ ' + totalFinal.toFixed(2) + '</span></div>' +
                '<div class="separator"></div>' +
                '<p class="center" style="font-size: 11px; font-style: italic;">Representación impresa de la ' + docType + '.<br>¡Gracias por tu preferencia!</p>' +
                '<button class="btn-print" onclick="window.print()">IMPRIMIR COMPROBANTE</button>' +
            '</div>' +
        '</body>' +
    '</html>';
}

function mostrarTicket(datos) {
    const fullDocumentId = generarIdDocumento(datos.docType);
    const ticketInfo = {
        docType: datos.docType,
        fullDocumentId: fullDocumentId,
        clientName: datos.clientName,
        companyVal: datos.companyVal,
        rucVal: datos.rucVal,
        deliveryType: datos.deliveryType,
        addressVal: datos.addressVal,
        cartArray: datos.cartArray,
        totalFinal: datos.totalFinal,
        discountAmount: datos.discountAmount,
        activeDiscount: datos.activeDiscount
    };
    const ticketDatos = obtenerDatosTicket(ticketInfo);
    const ticketHTML = generarTicketHTML(ticketDatos);
    const receiptWindow = window.open("", "_blank");
    if (receiptWindow) {
        receiptWindow.document.open();
        receiptWindow.document.write(ticketHTML);
        receiptWindow.document.close();
    }
}
function validarCamposPago(cardNumber, cardExpiry, cardCvv, cardName) {
    const cardError = document.getElementById("card-error");
    const expiryError = document.getElementById("expiry-error");
    const cvvError = document.getElementById("cvv-error");
    const nameError = document.getElementById("name-error");
    cardError.style.display = "none";
    expiryError.style.display = "none";
    cvvError.style.display = "none";
    nameError.style.display = "none";
    let camposCompletos = true;
    if (!validarNumeroTarjeta(cardNumber)) {
        cardNumber.style.borderColor = "#ff3333";
        cardError.style.display = "block";
        camposCompletos = false;
    } else {
        cardNumber.style.borderColor = "#00a650";
    }
    if (!validarFechaTarjeta(cardExpiry)) {
        cardExpiry.style.borderColor = "#ff3333";
        expiryError.style.display = "block";
        camposCompletos = false;
    } else {
        cardExpiry.style.borderColor = "#00a650";
    }
    if (!validarCvv(cardCvv)) {
        cardCvv.style.borderColor = "#ff3333";
        cvvError.style.display = "block";
        camposCompletos = false;
    } else {
        cardCvv.style.borderColor = "#00a650";
    }
    if (!validarNombreTitular(cardName)) {
        cardName.style.borderColor = "#ff3333";
        nameError.style.display = "block";
        camposCompletos = false;
    } else {
        cardName.style.borderColor = "#00a650";
    }
    return camposCompletos;
}

function limpiarDespuesPedido(mainOrderForm, rucGroup, cartAside) {
    cartArray = [];
    syncCartView();
    mainOrderForm.reset();
    if (rucGroup) rucGroup.style.display = "none";
    if (cartAside) cartAside.classList.remove("mobile-open");
}

function crearModalPago(datos) {
    const { clientName, rawSubtotal, discountAmount, totalFinal, activeDiscount, docType, companyVal, rucVal, deliveryType, addressVal, mainOrderForm, rucGroup, cartAside } = datos;
    const checkoutModal = document.createElement("div");
    checkoutModal.className = "welcome-overlay";
    checkoutModal.style.zIndex = "5500";
    checkoutModal.innerHTML = String.raw`
        <div class="welcome-card" style="max-width: 420px; border: 1px solid #00a650; background: #121212; text-align: left;">
            <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:15px;">
                <span style="font-size:1.5rem;">💳</span>
                <h3 style="color:#00a650; margin:0; font-size: 1.15rem;">Pasarela Mercado Pago</h3>
            </div>
            <div style="text-align:center; margin-bottom:15px; padding:10px; background:rgba(0,166,80,0.1); border-radius:6px;">
                <p style="color:#00a650; font-weight:bold;">👤 ${clientName}</p>
            </div>
            <form id="form-simulated-card" style="display:flex; flex-direction:column; gap:12px;">
                <div class="input-group">
                    <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:4px;">Número de Tarjeta</label>
                    <input type="text" id="card-number" placeholder="4111 1111 1111 1111" maxlength="19" required style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; box-sizing:border-box;" oninput="formatearNumeroTarjeta(this)" />
                    <span id="card-error" style="color:#ff3333; font-size:0.75rem; display:none; margin-top:4px;">❌ Debe tener 16 dígitos</span>
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="flex:1;">
                        <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:4px;">F. Vencimiento</label>
                        <input type="text" id="card-expiry" placeholder="MM/AA" maxlength="5" required style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; box-sizing:border-box;" oninput="formatearFechaTarjeta(this)" />
                        <span id="expiry-error" style="color:#ff3333; font-size:0.75rem; display:none; margin-top:4px;">❌ Formato MM/AA</span>
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:4px;">CVV</label>
                        <input type="password" id="card-cvv" placeholder="***" maxlength="4" required style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; box-sizing:border-box;" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 4)" />
                        <span id="cvv-error" style="color:#ff3333; font-size:0.75rem; display:none; margin-top:4px;">❌ 3 o 4 dígitos</span>
                    </div>
                </div>
                <div class="input-group">
                    <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:4px;">Nombre del Titular</label>
                    <input type="text" id="card-name" placeholder="Como figura en la tarjeta" required style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; box-sizing:border-box; text-transform:uppercase;" />
                    <span id="name-error" style="color:#ff3333; font-size:0.75rem; display:none; margin-top:4px;">❌ Ingresa el nombre</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding:10px; border-radius:6px; font-size:0.8rem; border:1px solid #222; margin-top:5px;">
                    <div style="display:flex; justify-content:space-between; color:#888; margin-bottom:4px;">
                        <span>Subtotal:</span><span>S/ ${rawSubtotal.toFixed(2)}</span>
                    </div>
                    ${activeDiscount > 0 ? `
                    <div style="display:flex; justify-content:space-between; color:#ff6b6b; margin-bottom:4px;">
                        <span>Descuento:</span><span>-S/ ${discountAmount.toFixed(2)}</span>
                    </div>` : ''}
                    <div style="display:flex; justify-content:space-between; font-weight:bold; color:#fff; font-size:0.9rem;">
                        <span>Total a debitar:</span><span style="color:#00a650;">S/ ${totalFinal.toFixed(2)}</span>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button type="button" id="btn-cancel-pay" style="flex:1; background:transparent; border:1px solid #555; color:#aaa; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">Cancelar</button>
                    <button type="submit" id="btn-pay-now" style="flex:2; background:#00a650; color:#fff; font-weight:bold; border:none; padding:10px; border-radius:6px; cursor:pointer;">PAGAR AHORA</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(checkoutModal);
    document.getElementById("btn-cancel-pay").addEventListener("click", function() {
        checkoutModal.remove();
        launchToast("Pago cancelado", "error");
    });
    document.getElementById("form-simulated-card").addEventListener("submit", function(subEv) {
        subEv.preventDefault();
        const cardNumber = document.getElementById("card-number");
        const cardExpiry = document.getElementById("card-expiry");
        const cardCvv = document.getElementById("card-cvv");
        const cardName = document.getElementById("card-name");
        if (!validarCamposPago(cardNumber, cardExpiry, cardCvv, cardName)) {
            launchToast("Por favor, completa todos los campos correctamente", "error");
            return;
        }
        checkoutModal.remove();
        launchToast("✅ ¡Pago procesado exitosamente!");
        const pedidoGuardado = guardarPedidoEnHistorial(
            cartArray,
            totalFinal,
            activeDiscount,
            addressVal,
            deliveryType
        );
        console.log('[Pedido] Pedido guardado en historial:', pedidoGuardado);
        const ticketDatos = {
            docType, clientName, companyVal, rucVal, deliveryType, addressVal,
            cartArray, totalFinal, discountAmount, activeDiscount
        };
        mostrarTicket(ticketDatos);
        limpiarDespuesPedido(mainOrderForm, rucGroup, cartAside);
        setTimeout(function() {
            triggerReviewModal();
        }, 800);
    });
}

// ============================================================ //
// FUNCIÓN PRINCIPAL
// ============================================================ //

if (mainOrderForm) {
    mainOrderForm.addEventListener("submit", function(e) {
        e.preventDefault();
        console.log('[Pedido] Iniciando proceso de finalización...');
        console.log('[Pedido] Carrito actual:', cartArray);
        if (!requireLogin()) {
            console.log('[Pedido] Usuario no logueado, cancelando.');
            return;
        }
        if (!validarCarritoVacio(cartArray)) {
            return;
        }
        const clientNameInput = document.getElementById("customer-name");
        const clientName = obtenerYValidarNombreCliente(clientNameInput);
        if (!clientName) {
            return;
        }
        const { docType, rucVal, companyVal, deliveryType, addressVal } = obtenerDatosPedido(
            receiptTypeSelect, rucInput, companyInput, deliverySelect, addressInput
        );
        const { rawSubtotal, discountAmount, totalFinal } = calcularTotalesPedido(cartArray, activeDiscount);
        const datosModal = {
            clientName, rawSubtotal, discountAmount, totalFinal, activeDiscount,
            docType, companyVal, rucVal, deliveryType, addressVal,
            mainOrderForm, rucGroup, cartAside
        };
        crearModalPago(datosModal);
    });
}

// ============================================================ //
// AUTO-COMPLETAR NOMBRE DEL USUARIO
// ============================================================ //

document.addEventListener('DOMContentLoaded', function() {
    mostrarUsuarioLogueado();
    window.addEventListener('storage', function(e) {
        if (e.key === 'sabor_estilo_user') {
            mostrarUsuarioLogueado();
        }
    });
});

console.log('✅ [Sistema] Carrito de compras inicializado correctamente.');
// ============================================================ //
// FUNCIÓN PRINCIPAL (REFACTORIZADA - COMPLEJIDAD ≤ 15)
// ============================================================ //

if (mainOrderForm) {
    mainOrderForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        console.log('[Pedido] Iniciando proceso de finalización...');
        console.log('[Pedido] Carrito actual:', cartArray);
        
        // 1. Verificar login
        if (!requireLogin()) {
            console.log('[Pedido] Usuario no logueado, cancelando.');
            return;
        }
        
        // 2. Verificar carrito vacío
        if (!validarCarritoVacio(cartArray)) {
            return;
        }
        
        // 3. Obtener y validar nombre del cliente
        const clientNameInput = document.getElementById("customer-name");
        const clientName = obtenerYValidarNombreCliente(clientNameInput);
        if (!clientName) {
            return;
        }
        
        // 4. Obtener datos del pedido
        const { docType, rucVal, companyVal, deliveryType, addressVal } = obtenerDatosPedido(
            receiptTypeSelect, rucInput, companyInput, deliverySelect, addressInput
        );
        
        // 5. Calcular totales
        const { rawSubtotal, discountAmount, totalFinal } = calcularTotalesPedido(cartArray, activeDiscount);
        
        // 6. Crear modal de pasarela de pago
        crearModalPago(clientName, rawSubtotal, discountAmount, totalFinal, activeDiscount, docType, companyVal, rucVal, deliveryType, addressVal, mainOrderForm, rucGroup, cartAside);
    });
}

// ============================================================ //
// AUTO-COMPLETAR NOMBRE DEL USUARIO AL CARGAR
// ============================================================ //

document.addEventListener('DOMContentLoaded', function() {
    mostrarUsuarioLogueado();
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'sabor_estilo_user') {
            mostrarUsuarioLogueado();
        }
    });
});

console.log('✅ [Sistema] Carrito de compras inicializado correctamente.');
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
