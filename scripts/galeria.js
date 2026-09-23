<<<<<<< HEAD
function galleryEsc(v) {
  return String(v ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
function galleryToast(message, type = "success") {
  if (typeof launchToast === "function") return launchToast(message, type);
  alert(message);
}

async function loadGallery() {
  const grid = document.getElementById("gallery-grid");
  try {
    const rows = await LaFondaDB.rpc("web_galeria_publica", {});
    if (!rows?.length) {
      grid.innerHTML = `<div class="gallery-empty">Todavía no hay fotografías aprobadas. El administrador puede publicar las fotos enviadas por clientes.</div>`;
      return;
    }
    grid.innerHTML = rows
      .map(
        (g, i) =>
          `<div class="gallery-item ${i % 5 === 3 ? "wide-item" : ""}" data-index="${i}"><img src="${g.imagen}" alt="${galleryEsc(g.titulo || "Foto")}" loading="lazy"><div class="gallery-overlay"><span>${galleryEsc(g.titulo || "Momento compartido")}</span><small>${galleryEsc(g.autor || "")}</small></div></div>`,
      )
      .join("");
    grid.querySelectorAll(".gallery-item").forEach(
      (item) =>
        (item.onclick = () => {
          const row = rows[Number(item.dataset.index)];
          openLightbox(
            row.imagen,
            row.titulo || "Momento compartido",
            row.autor || "",
          );
        }),
    );
  } catch (e) {
    grid.innerHTML = `<div class="gallery-empty">No se pudo cargar la galería: ${galleryEsc(e.message)}</div>`;
  }
}

function openLightbox(src, title, author) {
  let box = document.getElementById("gallery-lightbox");
  if (!box) {
    box = document.createElement("div");
    box.id = "gallery-lightbox";
    box.className = "gallery-lightbox";
    box.innerHTML = `<button id="gallery-lightbox-close">✕</button><div><img id="gallery-lightbox-img" alt=""><strong id="gallery-lightbox-title"></strong><small id="gallery-lightbox-author"></small></div>`;
    document.body.appendChild(box);
    box.onclick = (e) => {
      if (e.target === box) closeLightbox();
    };
    box.querySelector("#gallery-lightbox-close").onclick = closeLightbox;
  }
  box.querySelector("#gallery-lightbox-img").src = src;
  box.querySelector("#gallery-lightbox-title").textContent = title;
  box.querySelector("#gallery-lightbox-author").textContent = author;
  box.classList.add("open");
}
function closeLightbox() {
  document.getElementById("gallery-lightbox")?.classList.remove("open");
}

function initGalleryUpload() {
  const form = document.getElementById("gallery-upload-form"),
    file = document.getElementById("gallery-file"),
    preview = document.getElementById("gallery-preview"),
    status = document.getElementById("gallery-form-status");
  const s = LaFondaAuth.getSession();
  if (s?.rol === "CLIENTE")
    document.getElementById("gallery-name").value =
      `${s.nombre || ""} ${s.apellido || ""}`.trim();
  file.onchange = async () => {
    if (!file.files[0]) return;
    try {
      const img = await LaFondaImages.compress(file.files[0]);
      preview.src = img.preview;
      preview.hidden = false;
    } catch (e) {
      status.textContent = e.message;
    }
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const session = LaFondaAuth.getSession();
    if (!session || session.rol !== "CLIENTE") {
      status.textContent =
        "Inicia sesión con una cuenta de cliente para enviar fotos.";
      sessionStorage.setItem("lafonda_return_to", window.location.pathname);
      setTimeout(
        () => (window.location.href = "/src/modulo_auth/registrarse.html"),
        700,
      );
      return;
    }
    const selected = file.files[0];
    if (!selected) return;
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Procesando...";
    try {
      const image = await LaFondaImages.compress(selected);
      await LaFondaDB.rpc("web_enviar_foto", {
        p_email: session.email,
        p_password: session.password,
        p_nombre: document.getElementById("gallery-name").value.trim(),
        p_instagram: document.getElementById("gallery-instagram").value.trim(),
        p_imagen_base64: image.base64,
        p_mime: image.mime,
      });
      form.reset();
      preview.hidden = true;
      status.style.color = "#7bd88f";
      status.textContent =
        "Foto enviada. Quedará pendiente hasta que el administrador la apruebe.";
      galleryToast("Foto enviada para revisión");
    } catch (err) {
      status.style.color = "#ff6b6b";
      status.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "ENVIAR FOTO";
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  loadGallery();
  initGalleryUpload();
});
=======
// ============================================================ //
// CONFIGURACIÓN E INICIALIZACIÓN DE LA GALERÍA //
// ============================================================ //
console.log("[Galería] Inicializando módulo de Galería Fotográfica...");

// Mapeo de elementos de la interfaz de la Galería
const galleryGrid = document.querySelector(".gallery-grid");
const galleryItems = document.querySelectorAll(".gallery-item");
const uploadForm = document.querySelector(".auth-form");

// Reutilización segura de Toast (por si no se ha cargado globalmente)
function safeToast(message, type = "success") {
    if (typeof launchToast === "function") {
        launchToast(message, type);
    } else {
        alert(message);
    }
}

// ============================================================ //
// 1. FUNCIONALIDAD DE LIGHTBOX (VISUALIZADOR EN PANTALLA COMPLETA) //
// ============================================================ //
function createLightbox() {
    // Crear el contenedor del lightbox si no existe
    let lightbox = document.getElementById("gallery-lightbox");
    if (!lightbox) {
        lightbox = document.createElement("div");
        lightbox.id = "gallery-lightbox";
        
        // Estilos integrados rápidos y limpios para el overlay oscuro
        lightbox.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); display:none; align-items:center; justify-content:center; z-index:7000; opacity:0; transition:opacity 0.3s ease; padding:20px; box-sizing:border-box;";
        
        lightbox.innerHTML = `
            <button id="lightbox-close" style="position:absolute; top:20px; right:20px; background:transparent; color:#fff; border:none; font-size:2rem; cursor:pointer; font-family:inherit; transition:color 0.2s;">✕</button>
            <div style="max-width:90%; max-height:80%; display:flex; flex-direction:column; align-items:center; gap:15px;">
                <img id="lightbox-img" src="" alt="Vista previa" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:8px; border:1px solid #333; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                <span id="lightbox-caption" style="color:#ffb400; font-weight:bold; font-size:1.1rem; text-transform:uppercase; letter-spacing:1px;"></span>
            </div>
        `;
        document.body.appendChild(lightbox);

        // Evento para cerrar el lightbox
        document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }
    return lightbox;
}

function openLightbox(imgSrc, captionText) {
    const lightbox = createLightbox();
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption");

    if (lightboxImg && lightboxCaption) {
        lightboxImg.src = imgSrc;
        lightboxCaption.innerText = captionText;
        
        lightbox.style.display = "flex";
        // Pequeño timeout para permitir la transición de opacidad
        setTimeout(() => {
            lightbox.style.opacity = "1";
        }, 10);
        
        console.log("[Galería Log] Lightbox abierto para la imagen: " + captionText);
    }
}

function closeLightbox() {
    const lightbox = document.getElementById("gallery-lightbox");
    if (lightbox) {
        lightbox.style.opacity = "0";
        setTimeout(() => {
            lightbox.style.display = "none";
            console.log("[Galería Log] Lightbox cerrado por el usuario.");
        }, 300);
    }
}

// Asignar los eventos de clic a cada elemento actual de la grilla
galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
        const imgEl = item.querySelector("img");
        const captionEl = item.querySelector(".gallery-overlay span");
        
        if (imgEl && captionEl) {
            openLightbox(imgEl.src, captionEl.innerText);
        }
    });
});

// ============================================================ //
// 2. PROCESAMIENTO Y VALIDACIÓN DEL FORMULARIO DE ENVÍO //
// ============================================================ //
if (uploadForm) {
    // Capturar inputs internos de forma segura basado en tu estructura HTML
    const nameInput = uploadForm.querySelector('input[placeholder="Tu nombre"]');
    const instagramInput = uploadForm.querySelector('input[placeholder="@usuario"]');
    const fileInput = uploadForm.querySelector('input[type="file"]');

    uploadForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("[Formulario Galería] Iniciando validación de propuesta de foto...");

        const nameVal = nameInput ? nameInput.value.trim() : "";
        const instaVal = instagramInput ? instagramInput.value.trim() : "";
        const fileSelected = fileInput && fileInput.files ? fileInput.files[0] : null;

        // Validación estricta de campos obligatorios
        if (nameVal === "") {
            safeToast("Por favor, ingresa tu nombre.", "error");
            console.log("[Formulario Galería] Error: Campo de nombre vacío.");
            return;
        }

        if (!fileSelected) {
            safeToast("Por favor, selecciona una imagen para subir.", "error");
            console.log("[Formulario Galería] Error: No se ha seleccionado ningún archivo.");
            return;
        }

        console.log("[Formulario Galería] Validaciones correctas. Leyendo datos del archivo...");
        console.log("[Archivo] Nombre: " + fileSelected.name + " | Tamaño: " + (fileSelected.size / 1024).toFixed(2) + " KB | Tipo: " + fileSelected.type);

        // Simulación de lectura de archivo mediante FileReader (Simula persistencia o envío en string Base64)
        const reader = new FileReader();
        reader.onload = function (event) {
            const base64Image = event.target.result;
            console.log("[Formulario Galería] Archivo cargado en memoria exitosamente en formato binario/base64.");

            // Éxito visual para el cliente
            safeToast("¡Tu foto ha sido enviada con éxito!");
            console.log("[Formulario Galería] Éxito: Foto propuesta enviada por '" + nameVal + "' (Instagram: " + (instaVal || "No proporcionado") + ")");

            // Reseteo del formulario
            uploadForm.reset();
            console.log("[Formulario Galería] Campos del formulario restablecidos a sus valores por defecto.");
        };

        reader.onerror = function () {
            safeToast("Ocurrió un error al procesar la imagen.", "error");
            console.log("[Formulario Galería] Error crítico al leer el archivo seleccionado.");
        };

        // Ejecutar lectura simulada
        reader.readAsDataURL(fileSelected);
    });
} else {
    console.log("[Error] No se encontró el formulario .auth-form en el documento de galería.");
}
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
