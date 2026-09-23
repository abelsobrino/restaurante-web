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
