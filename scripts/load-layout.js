document.addEventListener("DOMContentLoaded", () => {
<<<<<<< HEAD
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
=======
    // 1. CARGA DINÁMICA DEL NAV (AHORA EN /src/nav.html)
    fetch('/src/nav.html') 
        .then(response => response.text())
        .then(html => {
            const navContainer = document.getElementById('global-nav');
            if (navContainer) {
                navContainer.innerHTML = html;
                inicializarNavToggle();
                marcarPaginaActiva();
                inicializarSesionUI();
                inicializarUserDropdown();
            }
        })
        .catch(error => console.error("Error cargando el menú:", error));

    // 2. CARGA DINÁMICA DEL FOOTER (AHORA EN /src/footer.html)
    fetch('/src/footer.html')
        .then(response => response.text())
        .then(html => {
            const footerContainer = document.getElementById('global-footer');
            if (footerContainer) {
                footerContainer.innerHTML = html;
            }
        })
        .catch(error => console.error("Error cargando el pie de página:", error));
});

/**
 * Activa los listeners para el menú hamburguesa móvil
 */
function inicializarNavToggle() {
    const toggleBtn = document.getElementById('nav-btn-toggle');
    const menuList = document.getElementById('nav-menu-list');

    if (toggleBtn && menuList) {
        toggleBtn.addEventListener('click', () => {
            toggleBtn.classList.toggle('active');
            menuList.classList.toggle('open');
        });

        const navLinks = menuList.querySelectorAll('.nav-link:not(.nav-user-btn)');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                toggleBtn.classList.remove('active');
                menuList.classList.remove('open');
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && menuList.classList.contains('open')) {
                toggleBtn.classList.remove('active');
                menuList.classList.remove('open');
            }
        });
    }
}

/**
 * Marca la página activa en el menú
 */
function marcarPaginaActiva() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');

        if (linkHref && (currentPath.endsWith(linkHref) || 
           (linkHref.includes('index.html') && (currentPath === '/' || currentPath.endsWith('index.html'))))) {
            link.classList.add('active');
        }
    });
}

function inicializarSesionUI() {
    const userDisplay = document.getElementById('user-display-name');
    const userBtn = document.getElementById('nav-user-btn');
    const dropdownProfile = document.getElementById('dropdown-profile');
    const dropdownLogout = document.getElementById('dropdown-logout');

    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');

    const estaLogueado = userData?.nombre;

    if (estaLogueado) {
        if (userDisplay) userDisplay.textContent = userData.nombre.split(' ')[0];
        if (userBtn) userBtn.classList.add('logged-in');
        if (dropdownProfile) {
            dropdownProfile.textContent = `👤 ${userData.nombre}`;
            dropdownProfile.href = '#';
        }
    } else {
        if (userDisplay) userDisplay.textContent = 'Cuenta';
        if (userBtn) userBtn.classList.remove('logged-in');
        if (dropdownProfile) {
            dropdownProfile.textContent = '👤 Iniciar Sesión';
            dropdownProfile.href = '/src/modulo_auth/registrarse.html';
        }
    }

    if (dropdownLogout) {
        dropdownLogout.addEventListener('click', (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    }
}
/**
 * CIERRA LA SESIÓN DEL USUARIO
 */
function cerrarSesion() {
    localStorage.removeItem('sabor_estilo_user');
    
    const userDisplay = document.getElementById('user-display-name');
    const userBtn = document.getElementById('nav-user-btn');
    const dropdownProfile = document.getElementById('dropdown-profile');

    if (userDisplay) userDisplay.textContent = 'Cuenta';
    if (userBtn) userBtn.classList.remove('logged-in');
    if (dropdownProfile) {
        dropdownProfile.textContent = '👤 Iniciar Sesión';
        dropdownProfile.href = '/src/modulo_auth/registrarse.html';
    }

    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.remove('open');

    if (typeof launchToast === 'function') {
        launchToast('Sesión cerrada correctamente');
    } else {
        alert('Sesión cerrada correctamente');
    }

    // Rutas protegidas
    const protectedPaths = ['/src/modulo_pedidos/', '/src/modulo_reservas/'];
    const currentPath = window.location.pathname;
    if (protectedPaths.some(p => currentPath.includes(p))) {
        window.location.href = '/index.html';
    }
}

/**
 * INICIALIZA EL MENÚ DESPLEGABLE DEL USUARIO
 */
function inicializarUserDropdown() {
    const userBtn = document.getElementById('nav-user-btn');
    const dropdown = document.getElementById('user-dropdown');

    if (userBtn && dropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!userBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') dropdown.classList.remove('open');
        });
    }
}

/**
 * VERIFICA SI EL USUARIO ESTÁ LOGUEADO
 */
function isUserLoggedIn() {
    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    return userData !== null && userData.nombre;
}

/**
 * OBTIENE LOS DATOS DEL USUARIO ACTUAL
 */
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
}

/**
 * SOLICITA LOGIN PARA ACCIONES PROTEGIDAS
 */
function requireLogin() {
    if (!isUserLoggedIn()) {
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
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
