(function () {
    const paginas = {
        "/index.html": { estilo: "/inicio.css" },
        "/paginas/nosotros/": { estilo: "/paginas/nosotros/nosotros.css" },
        "/paginas/menu/carta/": {
            estilo: "/paginas/menu/carta/carta.css",
            scripts: ["/js/stock.js", "/paginas/menu/carta/carta.js"],
            inicializadores: ["carta"],
            extras: ["mobile-cart-toggle"]
        },
        "/paginas/menu/galeria/": {
            estilo: "/paginas/menu/galeria/galeria.css",
            scripts: ["/js/image-utils.js", "/paginas/menu/galeria/galeria.js"],
            inicializadores: ["galeria"],
            extras: ["galeria-lightbox"]
        },
        "/paginas/resenas/": {
            estilo: "/paginas/resenas/resenas.css",
            scripts: ["/paginas/resenas/resenas.js"],
            inicializadores: ["resenas"]
        },
        "/paginas/contacto/": {
            estilo: "/paginas/contacto/contacto.css",
            scripts: ["/paginas/contacto/contacto.js", "/paginas/reservas/nueva-reserva/nueva-reserva.js"],
            inicializadores: ["contacto", "reservaContacto"]
        }
    };

    const contenidoCache = new Map();
    const scriptsCargados = new Map();
    let inicializado = false;
    let solicitudActual = 0;

    function normalizarRuta(ruta) {
        if (ruta === "/" || ruta === "/index.html") return "/index.html";
        if (ruta.endsWith("/index.html")) ruta = ruta.slice(0, -"index.html".length);
        return ruta.endsWith("/") ? ruta : `${ruta}/`;
    }

    function obtenerPagina(url) {
        if (url.origin !== location.origin) return null;
        return paginas[normalizarRuta(url.pathname)] || null;
    }

    async function obtenerContenido(ruta) {
        if (!contenidoCache.has(ruta)) {
            const tarea = fetch(ruta, { headers: { Accept: "text/html" } })
                .then(respuesta => {
                    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
                    return respuesta.text();
                })
                .then(html => {
                    const documento = new DOMParser().parseFromString(html, "text/html");
                    if (!documento.querySelector("main")) throw new Error("Página sin contenido principal");
                    return documento;
                })
                .catch(error => {
                    contenidoCache.delete(ruta);
                    throw error;
                });
            contenidoCache.set(ruta, tarea);
        }
        return contenidoCache.get(ruta);
    }

    async function cargarScript(ruta) {
        if (!scriptsCargados.has(ruta)) {
            const tarea = new Promise((resolver, rechazar) => {
                const existente = [...document.scripts].find(script => new URL(script.src || location.href).pathname === ruta && script.src);
                if (existente) {
                    resolver();
                    return;
                }
                const elemento = document.createElement("script");
                elemento.src = ruta;
                elemento.onload = resolver;
                elemento.onerror = () => rechazar(new Error(`No se pudo cargar ${ruta}`));
                document.body.appendChild(elemento);
            }).catch(error => {
                scriptsCargados.delete(ruta);
                throw error;
            });
            scriptsCargados.set(ruta, tarea);
        }
        return scriptsCargados.get(ruta);
    }

    async function prepararEstilo(estilo) {
        const existente = [...document.querySelectorAll('link[rel="stylesheet"]')]
            .find(link => new URL(link.href).pathname === estilo);
        if (existente) return existente;
        const enlace = document.createElement("link");
        enlace.rel = "stylesheet";
        enlace.href = estilo;
        enlace.dataset.lafondaPublicStyle = "";
        await new Promise((resolver, rechazar) => {
            enlace.onload = resolver;
            enlace.onerror = () => rechazar(new Error(`No se pudo cargar ${estilo}`));
            document.head.appendChild(enlace);
        });
        return enlace;
    }

    function reemplazarPagina(documento, ruta, estilo) {
        const actual = document.querySelector("main");
        const nuevo = documento.querySelector("main");
        const pie = document.getElementById("global-footer");
        if (!actual || !nuevo || !pie) throw new Error("Estructura de página inesperada");

        for (const extra of document.querySelectorAll('[data-lafonda-extra]')) extra.remove();
        for (const extraId of paginas[ruta].extras || []) {
            const extra = documento.getElementById(extraId);
            if (extra) {
                const nuevoExtra = document.importNode(extra, true);
                nuevoExtra.dataset.lafondaExtra = "";
                pie.before(nuevoExtra);
            }
        }
        actual.replaceWith(document.importNode(nuevo, true));
        const nuevoEstilo = [...document.querySelectorAll('link[rel="stylesheet"]')]
            .find(link => new URL(link.href).pathname === estilo);
        for (const link of document.querySelectorAll('link[data-lafonda-public-style]')) {
            if (link !== nuevoEstilo) link.remove();
        }
        if (nuevoEstilo) nuevoEstilo.dataset.lafondaPublicStyle = "";
        document.title = documento.title || "La Fonda";
        document.body.style.overflow = "";
        document.getElementById("toast-container")?.remove();
        document.querySelectorAll(".welcome-overlay").forEach(el => el.remove());
    }

    async function navegar(url, agregarHistorial) {
        const ruta = normalizarRuta(url.pathname);
        const pagina = paginas[ruta];
        if (!pagina) {
            location.assign(url.href);
            return;
        }
        const actual = ++solicitudActual;
        try {
            const [documento] = await Promise.all([
                obtenerContenido(ruta),
                prepararEstilo(pagina.estilo),
                ...((pagina.scripts || []).map(cargarScript))
            ]);
            if (actual !== solicitudActual) return;
            const cambiar = () => reemplazarPagina(documento, ruta, pagina.estilo);
            if (typeof document.startViewTransition === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
                await document.startViewTransition(cambiar).updateCallbackDone;
            } else {
                cambiar();
            }
            if (agregarHistorial) history.pushState({ lafonda: true }, "", url.href);
            window.marcarPaginaActiva?.();
            window.actualizarNavbarSesion?.();
            document.getElementById("nav-btn-toggle")?.classList.remove("active");
            document.getElementById("nav-menu-list")?.classList.remove("open");
            document.getElementById("user-dropdown")?.classList.remove("open");
            if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
            else window.scrollTo({ top: 0, behavior: "instant" });
            for (const nombre of pagina.inicializadores || []) {
                const inicializar = window.LaFondaPublicPages?.[nombre];
                if (typeof inicializar !== "function") throw new Error(`No se pudo iniciar ${nombre}`);
                Promise.resolve(inicializar()).catch(console.error);
            }
        } catch (error) {
            console.error("No se pudo cambiar de sección:", error);
            location.assign(url.href);
        }
    }

    function manejarClick(evento) {
        const enlace = evento.target.closest("a[href]");
        if (!enlace || evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
        if (enlace.target && enlace.target !== "_self" || enlace.hasAttribute("download")) return;
        const url = new URL(enlace.href, location.href);
        const ruta = normalizarRuta(url.pathname);
        if (!obtenerPagina(url) || !obtenerPagina(new URL(location.href))) return;
        if (ruta === normalizarRuta(location.pathname)) {
            if (url.hash === location.hash) return;
            if (!url.hash && !location.hash) return;
        }
        evento.preventDefault();
        navegar(url, true);
    }

    function precargar(evento) {
        const enlace = evento.target.closest("a[href]");
        if (!enlace) return;
        const url = new URL(enlace.href, location.href);
        if (!obtenerPagina(url) || normalizarRuta(url.pathname) === normalizarRuta(location.pathname)) return;
        obtenerContenido(normalizarRuta(url.pathname)).catch(() => {});
    }

    function inicializarTransiciones() {
        if (inicializado) return;
        inicializado = true;
        const pagina = obtenerPagina(new URL(location.href));
        if (pagina) {
            const actual = [...document.querySelectorAll('link[rel="stylesheet"]')]
                .find(link => new URL(link.href).pathname === pagina.estilo);
            if (actual) actual.dataset.lafondaPublicStyle = "";
        }
        document.addEventListener("click", manejarClick);
        document.addEventListener("pointerover", precargar, { passive: true });
        document.addEventListener("focusin", precargar);
        window.addEventListener("popstate", () => {
            if (obtenerPagina(new URL(location.href))) navegar(new URL(location.href), false);
            else location.reload();
        });
    }

    window.inicializarTransiciones = inicializarTransiciones;
})();
