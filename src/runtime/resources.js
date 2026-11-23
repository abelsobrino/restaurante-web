const modules = new Map();
const cssCache = new Map();
// Revalidar los CSS públicos tras desplegar nuevas versiones en Netlify/iOS.
const STYLE_REV = '2.0.8';
let leaflet;
function style(url) {
    if (!cssCache.has(url)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = `${url}?v=${STYLE_REV}`; link.media = 'not all'; link.dataset.routeStyle = '';
        const ready = new Promise((resolve, reject) => {
            link.onload = () => resolve(link);
            link.onerror = () => { link.remove(); cssCache.delete(url); reject(new Error('No se pudo cargar el estilo: ' + url)); };
        });
        cssCache.set(url, { link, ready });
        const priority = url.endsWith('/admin.css') || url.endsWith('/registrarse.css') ? 0 : url.includes('/componentes/menu/') ? 1 : 2;
        link.dataset.priority = String(priority);
        const after = [...document.querySelectorAll('link[data-route-style]')].find(other => Number(other.dataset.priority) > priority);
        document.head.insertBefore(link, after || null);
    }
    return cssCache.get(url).ready;
}
export function activateStyles(urls) {
    const desired = new Set(urls);
    for (const [url, entry] of cssCache) entry.link.media = desired.has(url) ? 'all' : 'not all';
    // Las hojas se insertan por prioridad al cargarlas y se reutilizan sin moverlas.
}
// Verificación explícita: no se muestra una página cuya hoja principal
// todavía no haya sido adjuntada y parseada por el navegador.
export function stylesReady(urls) {
    return urls.every(url => {
        const entry = cssCache.get(url);
        return entry?.link?.media === 'all' && Boolean(entry.link.sheet);
    });
}
function loadLeaflet() {
    if (!leaflet) leaflet = Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
        .then(([module]) => { window.L = module.default ?? module; return window.L; })
        .catch(error => { leaflet = null; throw error; });
    return leaflet;
}
export function prepareRoute(route) {
    if (!modules.has(route.path)) {
        const pending = Promise.all([route.load(), ...route.styles.map(style), ...(route.leaflet ? [loadLeaflet()] : [])])
            .then(([module]) => ({ ...route, Component: module.default }))
            .catch(error => { modules.delete(route.path); throw error; });
        modules.set(route.path, pending);
    }
    return modules.get(route.path);
}
