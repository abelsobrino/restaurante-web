const adminState = {
  dishes: [],
  categories: [],
  dishFilter: "all",
  combos: [],
  comboItems: [],
  coupons: [],
  gallery: [],
  reviews: [],
  period: "DIA",
};

function aSession() {
  return LaFondaAuth.getSession();
}
function aCreds() {
  const s = aSession();
  return { p_email: s.email, p_password: s.password };
}
function money(n) {
  return `S/ ${Number(n || 0).toFixed(2)}`;
}
function esc(v) {
  return String(v ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
function setStatus(message, type = "") {
  const el = document.getElementById("admin-status");
  el.textContent = message || "";
  el.className = `admin-status ${type}`;
}
function rpc(name, args = {}) {
  return LaFondaDB.rpc(name, { ...aCreds(), ...args });
}

function initTabs() {
  document.querySelectorAll("#admin-tabs button").forEach(
    (btn) =>
      (btn.onclick = () => {
        document
          .querySelectorAll("#admin-tabs button")
          .forEach((x) => x.classList.toggle("active", x === btn));
        document
          .querySelectorAll(".admin-panel")
          .forEach((p) =>
            p.classList.toggle("active", p.id === `panel-${btn.dataset.panel}`),
          );
      }),
  );
}

async function loadStats() {
  try {
    const d = await rpc("web_admin_estadisticas", {
      p_periodo: adminState.period,
    });
    document.getElementById("stat-ventas").textContent = d.ventas || 0;
    document.getElementById("stat-total").textContent = money(d.total);
    document.getElementById("stat-ticket").textContent = money(
      d.ticket_promedio,
    );
    document.getElementById("stat-origen").textContent =
      `${d.web || 0} / ${d.presencial || 0}`;
    const top = document.getElementById("top-platos");
    top.innerHTML = (d.top_platos || []).length
      ? (d.top_platos || [])
          .map(
            (x, i) =>
              `<div class="admin-list-item"><div><strong>${i + 1}. ${esc(x.nombre || "Plato")}</strong><small>${x.cantidad} unidades · ${money(x.importe)}</small></div></div>`,
          )
          .join("")
      : `<div class="empty-admin">Sin ventas en este período.</div>`;
    const sales = d.ultimas_ventas || [];
    document.getElementById("latest-sales").innerHTML = sales.length
      ? `<table class="admin-table"><thead><tr><th>Fecha</th><th>Pedido</th><th>Origen</th><th>Tipo</th><th>Total</th></tr></thead><tbody>${sales.map((x) => `<tr><td>${new Date(x.created_at).toLocaleString("es-PE")}</td><td>${esc(x.codigo)}</td><td>${esc(x.origen)}</td><td>${esc(x.tipo)}</td><td>${money(x.total)}</td></tr>`).join("")}</tbody></table>`
      : `<div class="empty-admin">Sin ventas.</div>`;
  } catch (e) {
    setStatus(e.message, "error");
  }
}

function initPeriods() {
  document.querySelectorAll("[data-period]").forEach(
    (btn) =>
      (btn.onclick = () => {
        adminState.period = btn.dataset.period;
        document
          .querySelectorAll("[data-period]")
          .forEach((x) => x.classList.toggle("active", x === btn));
        loadStats();
      }),
  );
}

async function loadDishes() {
  try {
    const d = await rpc("web_admin_platos");
    adminState.dishes = d.platos || [];
    adminState.categories = d.categorias || [];
    document.getElementById("dish-category").innerHTML = adminState.categories
      .map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`)
      .join("");
    renderDishes();
    renderComboSource();
  } catch (e) {
    setStatus(e.message, "error");
  }
}

function dishMatches(p) {
  if (adminState.dishFilter === "pending") return !p.tiene_imagen;
  if (adminState.dishFilter === "published")
    return p.tiene_imagen && p.disponible;
  if (adminState.dishFilter === "off") return !p.disponible;
  return true;
}
function renderDishes() {
  const rows = adminState.dishes.filter(dishMatches);
  const wrap = document.getElementById("admin-dishes");
  wrap.innerHTML = rows.length
    ? rows
        .map(
          (p) =>
            `<article class="dish-admin-card" data-id="${p.id}">${p.imagen ? `<img src="${p.imagen}" alt="">` : `<div class="dish-admin-placeholder">PENDIENTE DE IMAGEN</div>`}<div class="dish-admin-body"><strong>${esc(p.nombre)}</strong><small>${esc(p.categoria)} · ${money(p.precio)}</small><span class="status-pill ${!p.disponible ? "off" : p.tiene_imagen ? "ok" : "pending"}">${!p.disponible ? "NO DISPONIBLE" : p.tiene_imagen ? "PUBLICADO" : "SIN IMAGEN"}</span></div></article>`,
        )
        .join("")
    : `<div class="empty-admin">No hay platos con este filtro.</div>`;
  wrap
    .querySelectorAll("[data-id]")
    .forEach((el) => (el.onclick = () => editDish(Number(el.dataset.id))));
}
function clearDish() {
  document.getElementById("dish-form").reset();
  document.getElementById("dish-id").value = "";
  document.getElementById("dish-available").checked = true;
  document.getElementById("dish-preview").hidden = true;
  document.getElementById("dish-form-title").textContent = "Nuevo plato";
}
function editDish(id) {
  const p = adminState.dishes.find((x) => Number(x.id) === id);
  if (!p) return;
  document.getElementById("dish-id").value = p.id;
  document.getElementById("dish-name").value = p.nombre;
  document.getElementById("dish-description").value = p.descripcion || "";
  document.getElementById("dish-price").value = p.precio;
  document.getElementById("dish-time").value = p.tiempo_preparacion ?? "";
  document.getElementById("dish-category").value = p.categoria_id;
  document.getElementById("dish-available").checked = !!p.disponible;
  const img = document.getElementById("dish-preview");
  img.hidden = !p.imagen;
  if (p.imagen) img.src = p.imagen;
  document.getElementById("dish-form-title").textContent =
    `Editar: ${p.nombre}`;
  window.scrollTo({
    top: document.getElementById("dish-form").offsetTop - 110,
    behavior: "smooth",
  });
}

async function saveDish(event) {
  event.preventDefault();
  setStatus("Guardando plato...");
  try {
    const file = document.getElementById("dish-image").files[0];
    let image = null;
    if (file) image = await LaFondaImages.compress(file);
    await rpc("web_admin_guardar_plato", {
      p_id: valueOrNull("dish-id"),
      p_nombre: val("dish-name"),
      p_descripcion: val("dish-description"),
      p_precio: Number(val("dish-price")),
      p_categoria_id: Number(val("dish-category")),
      p_tiempo: numOrNull("dish-time"),
      p_disponible: document.getElementById("dish-available").checked,
      p_imagen_base64: image?.base64 || null,
      p_imagen_mime: image?.mime || null,
    });
    setStatus(
      "Plato guardado. Si tiene imagen y está disponible, ya puede aparecer en la carta.",
      "success",
    );
    clearDish();
    await loadDishes();
  } catch (e) {
    setStatus(e.message, "error");
  }
}

function initDishControls() {
  document.querySelectorAll("[data-dish-filter]").forEach(
    (btn) =>
      (btn.onclick = () => {
        adminState.dishFilter = btn.dataset.dishFilter;
        document
          .querySelectorAll("[data-dish-filter]")
          .forEach((x) => x.classList.toggle("active", x === btn));
        renderDishes();
      }),
  );
  document.getElementById("dish-new").onclick = clearDish;
  document.getElementById("dish-form").onsubmit = saveDish;
  document.getElementById("dish-image").onchange = async (e) => {
    if (!e.target.files[0]) return;
    try {
      const x = await LaFondaImages.compress(e.target.files[0]);
      const img = document.getElementById("dish-preview");
      img.src = x.preview;
      img.hidden = false;
    } catch (err) {
      setStatus(err.message, "error");
    }
  };
}

function renderComboSource() {
  const q = (
    document.getElementById("combo-search")?.value || ""
  ).toLowerCase();
  const rows = adminState.dishes.filter((p) =>
    `${p.nombre} ${p.categoria}`.toLowerCase().includes(q),
  );
  const wrap = document.getElementById("combo-source");
  wrap.innerHTML = rows
    .map(
      (p) =>
        `<div class="combo-source-item" draggable="true" data-id="${p.id}"><strong>${esc(p.nombre)}</strong><small>${esc(p.categoria)} · ${money(p.precio)}</small></div>`,
    )
    .join("");
  wrap.querySelectorAll("[draggable=true]").forEach((el) => {
    el.ondragstart = (e) => e.dataTransfer.setData("text/plain", el.dataset.id);
    el.ondblclick = () => addComboItem(Number(el.dataset.id));
  });
}
function addComboItem(id, qty = 1) {
  const p = adminState.dishes.find((x) => Number(x.id) === Number(id));
  if (!p) return;
  const existing = adminState.comboItems.find((x) => x.plato_id === Number(id));
  if (existing) existing.cantidad += qty;
  else
    adminState.comboItems.push({
      plato_id: Number(id),
      cantidad: qty,
      nombre: p.nombre,
      precio: Number(p.precio),
    });
  renderComboSelected();
}
function renderComboSelected() {
  const wrap = document.getElementById("combo-selected");
  wrap.innerHTML = adminState.comboItems
    .map(
      (x, i) =>
        `<div class="combo-selected-row"><span>${esc(x.nombre)}</span><input type="number" min="1" max="50" value="${x.cantidad}" data-qty="${i}"><button type="button" data-remove="${i}">×</button></div>`,
    )
    .join("");
  wrap.querySelectorAll("[data-qty]").forEach(
    (inp) =>
      (inp.onchange = () => {
        adminState.comboItems[Number(inp.dataset.qty)].cantidad = Math.max(
          1,
          Number(inp.value) || 1,
        );
        renderComboSelected();
      }),
  );
  wrap.querySelectorAll("[data-remove]").forEach(
    (btn) =>
      (btn.onclick = () => {
        adminState.comboItems.splice(Number(btn.dataset.remove), 1);
        renderComboSelected();
      }),
  );
  document.getElementById("combo-regular").value = money(
    adminState.comboItems.reduce((s, x) => s + x.precio * x.cantidad, 0),
  );
}
function clearCombo() {
  document.getElementById("combo-form").reset();
  document.getElementById("combo-id").value = "";
  document.getElementById("combo-active").checked = true;
  document
    .querySelectorAll("#combo-days input")
    .forEach((x) => (x.checked = true));
  adminState.comboItems = [];
  renderComboSelected();
}
async function loadCombos() {
  try {
    adminState.combos = (await rpc("web_admin_combos")) || [];
    renderExistingCombos();
  } catch (e) {
    setStatus(e.message, "error");
  }
}
function renderExistingCombos() {
  const wrap = document.getElementById("combo-existing");
  wrap.innerHTML = adminState.combos.length
    ? `<h3 style="margin-top:14px">Combos guardados</h3>` +
      adminState.combos
        .map(
          (c) =>
            `<div class="admin-list-item"><div><strong>${esc(c.nombre)}</strong><small>${money(c.precio)} · ${c.tiene_imagen ? "con imagen" : "sin imagen"} · ${c.activo ? "activo" : "inactivo"}</small></div><button type="button" data-edit-combo="${c.id}">Editar</button></div>`,
        )
        .join("")
    : `<div class="empty-admin">Todavía no hay combos.</div>`;
  wrap
    .querySelectorAll("[data-edit-combo]")
    .forEach((b) => (b.onclick = () => editCombo(Number(b.dataset.editCombo))));
}
function editCombo(id) {
  const c = adminState.combos.find((x) => Number(x.id) === id);
  if (!c) return;
  document.getElementById("combo-id").value = c.id;
  document.getElementById("combo-name").value = c.nombre;
  document.getElementById("combo-description").value = c.descripcion || "";
  document.getElementById("combo-price").value = c.precio;
  document.getElementById("combo-active").checked = !!c.activo;
  adminState.comboItems = (c.items || []).map((x) => ({
    plato_id: Number(x.plato_id),
    cantidad: Number(x.cantidad),
    nombre: x.nombre,
    precio: Number(x.precio),
  }));
  renderComboSelected();
  const pg = c.programacion || {};
  document.getElementById("combo-date-start").value = pg.fecha_inicio || "";
  document.getElementById("combo-date-end").value = pg.fecha_fin || "";
  document.getElementById("combo-time-start").value =
    pg.hora_inicio?.slice(0, 5) || "";
  document.getElementById("combo-time-end").value =
    pg.hora_fin?.slice(0, 5) || "";
  const days = (pg.dias_semana || [1, 2, 3, 4, 5, 6, 7]).map(Number);
  document
    .querySelectorAll("#combo-days input")
    .forEach((x) => (x.checked = days.includes(Number(x.value))));
}
async function saveCombo(event) {
  event.preventDefault();
  if (!adminState.comboItems.length)
    return setStatus("Arrastra al menos un plato al combo.", "error");
  const days = [...document.querySelectorAll("#combo-days input:checked")].map(
    (x) => Number(x.value),
  );
  if (!days.length) return setStatus("Selecciona al menos un día.", "error");
  try {
    setStatus("Guardando combo...");
    const file = document.getElementById("combo-image").files[0];
    let image = null;
    if (file) image = await LaFondaImages.compress(file);
    await rpc("web_admin_guardar_combo", {
      p_id: valueOrNull("combo-id"),
      p_nombre: val("combo-name"),
      p_descripcion: val("combo-description"),
      p_precio: Number(val("combo-price")),
      p_activo: document.getElementById("combo-active").checked,
      p_items: adminState.comboItems.map((x) => ({
        plato_id: x.plato_id,
        cantidad: x.cantidad,
      })),
      p_dias: days,
      p_fecha_inicio: val("combo-date-start") || null,
      p_fecha_fin: val("combo-date-end") || null,
      p_hora_inicio: val("combo-time-start") || null,
      p_hora_fin: val("combo-time-end") || null,
      p_imagen_base64: image?.base64 || null,
      p_imagen_mime: image?.mime || null,
    });
    setStatus("Combo guardado.", "success");
    clearCombo();
    await loadCombos();
  } catch (e) {
    setStatus(e.message, "error");
  }
}
function initComboControls() {
  const dz = document.getElementById("combo-dropzone");
  dz.ondragover = (e) => {
    e.preventDefault();
    dz.classList.add("dragover");
  };
  dz.ondragleave = () => dz.classList.remove("dragover");
  dz.ondrop = (e) => {
    e.preventDefault();
    dz.classList.remove("dragover");
    addComboItem(Number(e.dataTransfer.getData("text/plain")));
  };
  document.getElementById("combo-search").oninput = renderComboSource;
  document.getElementById("combo-new").onclick = clearCombo;
  document.getElementById("combo-form").onsubmit = saveCombo;
}

async function loadCoupons() {
  try {
    adminState.coupons = (await rpc("web_admin_cupones")) || [];
    renderCoupons();
  } catch (e) {
    setStatus(e.message, "error");
  }
}
function renderCoupons() {
  const wrap = document.getElementById("coupon-list");
  wrap.innerHTML = adminState.coupons.length
    ? adminState.coupons
        .map(
          (c) =>
            `<div class="admin-list-item"><div><strong>${esc(c.codigo)}</strong><small>${c.tipo === "PORCENTAJE" ? `${c.valor}%` : money(c.valor)} · ${c.visible_publico ? "visible" : "oculto"} · ${c.activo ? "activo" : "inactivo"} · ${c.usos} usos</small></div><button type="button" data-edit-coupon="${c.id}">Editar</button></div>`,
        )
        .join("")
    : `<div class="empty-admin">No hay cupones.</div>`;
  wrap
    .querySelectorAll("[data-edit-coupon]")
    .forEach(
      (b) => (b.onclick = () => editCoupon(Number(b.dataset.editCoupon))),
    );
}
function toLocalInput(v) {
  if (!v) return "";
  const d = new Date(v);
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}
function editCoupon(id) {
  const c = adminState.coupons.find((x) => Number(x.id) === id);
  if (!c) return;
  document.getElementById("coupon-id").value = c.id;
  document.getElementById("coupon-code").value = c.codigo;
  document.getElementById("coupon-description").value = c.descripcion || "";
  document.getElementById("coupon-type").value = c.tipo;
  document.getElementById("coupon-value").value = c.valor;
  document.getElementById("coupon-min").value = c.minimo_compra || 0;
  document.getElementById("coupon-limit").value = c.limite_usos || "";
  document.getElementById("coupon-start").value = toLocalInput(c.fecha_inicio);
  document.getElementById("coupon-end").value = toLocalInput(c.fecha_fin);
  document.getElementById("coupon-visible").checked = !!c.visible_publico;
  document.getElementById("coupon-active").checked = !!c.activo;
}
function clearCoupon() {
  document.getElementById("coupon-form").reset();
  document.getElementById("coupon-id").value = "";
  document.getElementById("coupon-min").value = "0";
  document.getElementById("coupon-active").checked = true;
}
async function saveCoupon(event) {
  event.preventDefault();
  try {
    await rpc("web_admin_guardar_cupon", {
      p_id: valueOrNull("coupon-id"),
      p_codigo: val("coupon-code"),
      p_descripcion: val("coupon-description"),
      p_tipo: val("coupon-type"),
      p_valor: Number(val("coupon-value")),
      p_minimo: Number(val("coupon-min") || 0),
      p_fecha_inicio: val("coupon-start")
        ? new Date(val("coupon-start")).toISOString()
        : null,
      p_fecha_fin: val("coupon-end")
        ? new Date(val("coupon-end")).toISOString()
        : null,
      p_limite: numOrNull("coupon-limit"),
      p_visible: document.getElementById("coupon-visible").checked,
      p_activo: document.getElementById("coupon-active").checked,
    });
    setStatus("Cupón guardado.", "success");
    clearCoupon();
    await loadCoupons();
  } catch (e) {
    setStatus(e.message, "error");
  }
}
function initCouponControls() {
  document.getElementById("coupon-new").onclick = clearCoupon;
  document.getElementById("coupon-form").onsubmit = saveCoupon;
}

async function loadContent() {
  try {
    const [g, r] = await Promise.all([
      rpc("web_admin_galeria"),
      rpc("web_admin_resenas"),
    ]);
    adminState.gallery = g || [];
    adminState.reviews = r || [];
    renderGalleryAdmin();
    renderReviewsAdmin();
  } catch (e) {
    setStatus(e.message, "error");
  }
}
function renderGalleryAdmin() {
  const wrap = document.getElementById("gallery-admin");
  wrap.innerHTML = adminState.gallery.length
    ? adminState.gallery
        .map(
          (g) =>
            `<article class="moderation-card"><img src="${g.imagen}" alt=""><div class="moderation-body"><strong>${esc(g.autor)}</strong><small>${esc(g.instagram || "")} · ${g.estado}</small><input class="admin-search" data-title-photo="${g.id}" placeholder="Título" value="${esc(g.titulo || "")}"><div class="moderation-actions"><button class="approve" data-photo="${g.id}" data-state="PUBLICADA">Publicar</button><button class="reject" data-photo="${g.id}" data-state="RECHAZADA">Rechazar</button></div></div></article>`,
        )
        .join("")
    : `<div class="empty-admin">No hay fotos enviadas.</div>`;
  wrap.querySelectorAll("[data-photo]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          const id = Number(b.dataset.photo);
          const title = wrap.querySelector(`[data-title-photo="${id}"]`).value;
          await rpc("web_admin_moderar_foto", {
            p_id: id,
            p_estado: b.dataset.state,
            p_titulo: title,
            p_orden: 0,
          });
          setStatus("Foto actualizada.", "success");
          await loadContent();
        } catch (e) {
          setStatus(e.message, "error");
        }
      }),
  );
}
function renderReviewsAdmin() {
  const wrap = document.getElementById("reviews-admin");
  wrap.innerHTML = adminState.reviews.length
    ? adminState.reviews
        .map(
          (r) =>
            `<div class="admin-list-item"><div><strong>${"★".repeat(r.calificacion)} ${esc(r.autor)}</strong><small>${esc(r.comentario || "")} · ${r.estado}</small></div><div><button data-review="${r.id}" data-state="PUBLICADA">Publicar</button><button data-review="${r.id}" data-state="OCULTA">Ocultar</button></div></div>`,
        )
        .join("")
    : `<div class="empty-admin">No hay reseñas.</div>`;
  wrap.querySelectorAll("[data-review]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await rpc("web_admin_moderar_resena", {
            p_id: Number(b.dataset.review),
            p_estado: b.dataset.state,
          });
          setStatus("Reseña actualizada.", "success");
          await loadContent();
        } catch (e) {
          setStatus(e.message, "error");
        }
      }),
  );
}

async function loadDelivery() {
  try {
    const d = await rpc("web_admin_delivery");
    document.getElementById("delivery-active").checked = !!d.activo;
    document.getElementById("delivery-lat").value = d.latitud ?? "";
    document.getElementById("delivery-lng").value = d.longitud ?? "";
    document.getElementById("delivery-price").value = d.precio_km ?? 2.5;
    document.getElementById("delivery-min").value = d.tarifa_minima ?? 5;
    document.getElementById("delivery-radius").value = d.radio_maximo_km ?? 15;
  } catch (e) {
    setStatus(e.message, "error");
  }
}
async function saveDelivery(event) {
  event.preventDefault();
  try {
    await rpc("web_admin_guardar_delivery", {
      p_activo: document.getElementById("delivery-active").checked,
      p_latitud: numOrNull("delivery-lat"),
      p_longitud: numOrNull("delivery-lng"),
      p_precio_km: Number(val("delivery-price")),
      p_tarifa_minima: Number(val("delivery-min")),
      p_radio: Number(val("delivery-radius")),
    });
    setStatus("Configuración de delivery guardada.", "success");
  } catch (e) {
    setStatus(e.message, "error");
  }
}

function val(id) {
  return document.getElementById(id).value.trim();
}
function valueOrNull(id) {
  const v = val(id);
  return v ? Number(v) : null;
}
function numOrNull(id) {
  const v = val(id);
  return v === "" ? null : Number(v);
}

async function initAdmin() {
  const s = aSession();
  if (!s || s.rol !== "ADMIN") {
    window.location.href = "/src/modulo_auth/registrarse.html";
    return;
  }
  if (s.modo !== "ADMIN") {
    window.location.href = "/src/modulo_auth/elegir-modo.html";
    return;
  }
  if (!LaFondaDB.isConfigured()) {
    setStatus(
      "Configura scripts/config.js con tu anon key antes de usar el panel.",
      "error",
    );
    return;
  }
  initTabs();
  initPeriods();
  initDishControls();
  initComboControls();
  initCouponControls();
  document.getElementById("delivery-form").onsubmit = saveDelivery;
  await Promise.all([
    loadStats(),
    loadDishes(),
    loadCombos(),
    loadCoupons(),
    loadContent(),
    loadDelivery(),
  ]);
}
document.addEventListener("DOMContentLoaded", initAdmin);
