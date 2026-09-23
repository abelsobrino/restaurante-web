document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    loadFragment("/src/nav.html", "global-nav"),
    loadFragment("/src/footer.html", "global-footer"),
  ]).then(() => {
    inicializarNavToggle();
    marcarPaginaActiva();
    inicializarSesionUI();
    inicializarUserDropdown();
    inicializarTransiciones();
  });
});

async function loadFragment(url, id) {
  const container = document.getElementById(id);
  if (!container) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}`);
    container.innerHTML = await response.text();
  } catch (error) {
    console.error(`Error cargando ${url}:`, error);
  }
}

function sessionActual() {
  if (window.LaFondaAuth?.getSession) return window.LaFondaAuth.getSession();
  try {
    return JSON.parse(sessionStorage.getItem("lafonda_web_session") || "null");
  } catch {
    return null;
  }
}

function inicializarNavToggle() {
  const toggleBtn = document.getElementById("nav-btn-toggle");
  const menuList = document.getElementById("nav-menu-list");
  if (!toggleBtn || !menuList) return;
  toggleBtn.addEventListener("click", () => {
    toggleBtn.classList.toggle("active");
    menuList.classList.toggle("open");
  });
  menuList.querySelectorAll(".nav-link").forEach((link) =>
    link.addEventListener("click", () => {
      toggleBtn.classList.remove("active");
      menuList.classList.remove("open");
    }),
  );
}

function marcarPaginaActiva() {
  const currentPath = window.location.pathname;
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (!href) return;
    if (
      currentPath === href ||
      (href === "/index.html" &&
        (currentPath === "/" || currentPath.endsWith("/index.html")))
    )
      link.classList.add("active");
  });
}

function inicializarSesionUI() {
  const session = sessionActual();
  const userDisplay = document.getElementById("user-display-name");
  const userBtn = document.getElementById("nav-user-btn");
  const profile = document.getElementById("dropdown-profile");
  const logout = document.getElementById("dropdown-logout");
  const authItem = document.getElementById("nav-auth-item");
  const adminItem = document.getElementById("nav-admin-item");
  const modeRow = document.getElementById("dropdown-mode-row");
  const pedidos = document.getElementById("dropdown-pedidos");
  const reservas = document.getElementById("dropdown-reservas");

  if (session) {
    if (userDisplay)
      userDisplay.textContent = (session.nombre || session.email).split(" ")[0];
    userBtn?.classList.add("logged-in");
    if (profile) {
      profile.textContent = `👤 ${session.nombre || session.email}`;
      profile.href = "#";
    }
    if (authItem) authItem.hidden = true;
    if (logout) logout.hidden = false;
    if (session.rol === "ADMIN") {
      if (adminItem) adminItem.hidden = session.modo !== "ADMIN";
      if (modeRow) modeRow.hidden = false;
      // Un admin en vista cliente puede revisar contenido, pero sus credenciales no son las de un cliente.
      if (pedidos) pedidos.style.display = "none";
      if (reservas) reservas.style.display = "none";
    }
  } else {
    if (userDisplay) userDisplay.textContent = "Cuenta";
    userBtn?.classList.remove("logged-in");
    if (profile) {
      profile.textContent = "👤 Iniciar Sesión";
      profile.href = "/src/modulo_auth/registrarse.html";
    }
    if (logout) logout.style.display = "none";
    if (adminItem) adminItem.hidden = true;
    if (modeRow) modeRow.hidden = true;
  }

  logout?.addEventListener("click", (event) => {
    event.preventDefault();
    if (window.LaFondaAuth?.logout) window.LaFondaAuth.logout();
    else {
      sessionStorage.removeItem("lafonda_web_session");
      localStorage.removeItem("la_fonda_user");
      window.location.href = "/index.html";
    }
  });
}

function inicializarUserDropdown() {
  const btn = document.getElementById("nav-user-btn");
  const dropdown = document.getElementById("user-dropdown");
  if (!btn || !dropdown) return;
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("open");
  });
  document.addEventListener("click", (event) => {
    if (!btn.contains(event.target) && !dropdown.contains(event.target))
      dropdown.classList.remove("open");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") dropdown.classList.remove("open");
  });
}

function isUserLoggedIn() {
  return Boolean(sessionActual());
}
function getCurrentUser() {
  return sessionActual();
}
function requireLogin() {
  if (isUserLoggedIn()) return true;
  sessionStorage.setItem("lafonda_return_to", window.location.pathname);
  window.location.href = "/src/modulo_auth/registrarse.html";
  return false;
}

function inicializarTransiciones() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const href = link.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    )
      return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    // Navegadores con View Transitions para navegación no necesitan fallback.
    if (CSS.supports?.("view-transition-name: none")) return;
    event.preventDefault();
    document.body.classList.add("page-leaving");
    setTimeout(() => {
      window.location.href = destination.href;
    }, 130);
  });
}
