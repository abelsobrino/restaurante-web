function rEsc(v) {
  return String(v ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
async function loadPublicReviews() {
  const grid = document.getElementById("reviews-grid");
  try {
    const rows = await LaFondaDB.rpc("web_resenas_publicas", {});
    if (!rows?.length) {
      grid.innerHTML = `<div class="reviews-empty">Todavía no hay reseñas publicadas.</div>`;
      return;
    }
    grid.innerHTML = rows
      .map(
        (r) =>
          `<div class="login-card review-item"><div class="stars">${"★".repeat(Number(r.calificacion))}${"☆".repeat(5 - Number(r.calificacion))}</div><p class="review-text">“${rEsc(r.comentario || "")}”</p><div class="review-author"><strong>- ${rEsc(r.autor)}</strong></div></div>`,
      )
      .join("");
  } catch (e) {
    grid.innerHTML = `<div class="reviews-empty">No se pudieron cargar las reseñas: ${rEsc(e.message)}</div>`;
  }
}
async function loadReviewableOrders() {
  const select = document.getElementById("review-order"),
    s = LaFondaAuth.getSession();
  if (!s || s.rol !== "CLIENTE") {
    select.innerHTML = `<option value="">Inicia sesión como cliente</option>`;
    return;
  }
  try {
    const rows = await LaFondaDB.rpc("web_pedidos_resenables", {
      p_email: s.email,
      p_password: s.password,
    });
    select.innerHTML = rows?.length
      ? `<option value="">Selecciona un pedido</option>` +
        rows
          .map(
            (p) =>
              `<option value="${p.id}">${rEsc(p.codigo)} · ${new Date(p.fecha).toLocaleDateString("es-PE")} · S/ ${Number(p.total).toFixed(2)}</option>`,
          )
          .join("")
      : `<option value="">No tienes pedidos pagados pendientes de reseña</option>`;
  } catch (e) {
    select.innerHTML = `<option value="">${rEsc(e.message)}</option>`;
  }
}
async function submitReview(e) {
  e.preventDefault();
  const status = document.getElementById("review-status"),
    s = LaFondaAuth.getSession();
  if (!s || s.rol !== "CLIENTE") {
    status.textContent = "Inicia sesión con una cuenta de cliente.";
    return;
  }
  const order = Number(document.getElementById("review-order").value);
  if (!order) {
    status.textContent = "Selecciona un pedido.";
    return;
  }
  try {
    await LaFondaDB.rpc("web_crear_resena", {
      p_email: s.email,
      p_password: s.password,
      p_pedido_id: order,
      p_calificacion: Number(document.getElementById("review-rating").value),
      p_comentario: document.getElementById("review-text").value.trim(),
    });
    e.target.reset();
    status.style.color = "#7bd88f";
    status.textContent =
      "Reseña enviada. El administrador decidirá cuándo publicarla.";
    await loadReviewableOrders();
  } catch (err) {
    status.style.color = "#ff6b6b";
    status.textContent = err.message;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadPublicReviews();
  loadReviewableOrders();
  document
    .getElementById("review-form")
    .addEventListener("submit", submitReview);
});
