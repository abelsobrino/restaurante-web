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
