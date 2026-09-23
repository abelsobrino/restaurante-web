<<<<<<< HEAD
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
=======
// ============================================================ //
// CONFIGURACIÓN E INICIALIZACIÓN DEL MÓDULO DE RESEÑAS //
// ============================================================ //
console.log("[Reseñas] Inicializando contenedor interactivo de opiniones...");

// Mapeo de elementos de la interfaz basados en tu HTML
const reviewsGrid = document.querySelector(".reviews-grid");
const reviewForm = document.querySelector(".auth-form");

// Reutilización segura de la alerta Toast del proyecto
function safeToast(message, type = "success") {
    if (typeof launchToast === "function") {
        launchToast(message, type);
    } else {
        alert(message);
    }
}

// Mapas de conversión para transformar la opción del select en caracteres de estrellas
const starMap = {
    "5": "★★★★★",
    "4": "★★★★☆",
    "3": "★★★☆☆"
};

// ============================================================ //
// 1. CONTROLADORES DEL FLUJO DE INSERCIÓN (CREATE & READ) //
// ============================================================ //
if (reviewForm && reviewsGrid) {
    // Captura segura de los controles internos del formulario
    const nameInput = reviewForm.querySelector('input[type="text"]');
    const textInput = reviewForm.querySelector('textarea');
    const ratingSelect = reviewForm.querySelector('select');

    reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("[Formulario Reseñas] Capturando datos para inserción de fila...");

        const authorName = nameInput ? nameInput.value.trim() : "";
        const reviewText = textInput ? textInput.value.trim() : "";
        const selectValue = ratingSelect ? ratingSelect.value : "5";

        // Extraer el primer carácter numérico del select (ej: "5 Estrellas" -> "5")
        const ratingNumeric = selectValue.charAt(0); 
        const visualStars = starMap[ratingNumeric] || "★★★★★";

        // --- VALIDACIONES ESTRICTAS ---
        if (authorName === "") {
            safeToast("Por favor, introduce tu nombre.", "error");
            console.log("[Formulario Reseñas] Error: Validación rechazada por nombre vacío.");
            return;
        }

        if (reviewText === "") {
            safeToast("Por favor, cuéntanos tu experiencia en el comentario.", "error");
            console.log("[Formulario Reseñas] Error: Validación rechazada por texto vacío.");
            return;
        }

        console.log("[Formulario Reseñas] Validaciones aprobadas con éxito.");

        // --- CONSTRUCCIÓN DINÁMICA DEL NUEVO COMPONENTE (CREATE) ---
        // Creamos la tarjeta respetando exactamente la estructura de clases del CSS
        const newReviewCard = document.createElement("div");
        newReviewCard.className = "login-card review-item";
        
        // Efecto de entrada suave para el nuevo elemento inyectado
        newReviewCard.style.opacity = "0";
        newReviewCard.style.transform = "scale(0.9) translateY(20px)";
        newReviewCard.style.transition = "all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)";

        newReviewCard.innerHTML = `
            <div class="stars">${visualStars}</div>
            <p class="review-text">"${reviewText}"</p>
            <div class="review-author">
                <strong>- ${authorName}</strong>
            </div>
        `;

        // Insertar al inicio de la grilla (prepend) para que se vea inmediatamente
        reviewsGrid.insertBefore(newReviewCard, reviewsGrid.firstChild);
        console.log("[Estructura DOM] Inyectando nueva tarjeta de opinión en el contenedor principal.");

        // Forzar reflow para activar la animación de entrada suave de CSS/JS
        setTimeout(() => {
            newReviewCard.style.opacity = "1";
            newReviewCard.style.transform = "scale(1) translateY(0)";
        }, 50);

        // --- ÉXITO Y REINICIO ---
        safeToast("¡Tu reseña ha sido publicada con éxito!");
        console.log("[Persistencia Simulada] Éxito: Reseña guardada temporalmente. Autor: " + authorName + " (" + ratingNumeric + " estrellas).");

        // Limpiar el formulario para nuevos ingresos
        reviewForm.reset();
        console.log("[Formulario Reseñas] Restableciendo inputs a valores base.");
    });
} else {
    console.log("[Error Crítico] No se localizó el contenedor .reviews-grid o el formulario .auth-form.");
}
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
