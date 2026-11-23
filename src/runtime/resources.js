const modules = new Map();
let leaflet;

// Los estilos de todas las páginas forman una hoja única compilada por Vite
// (enlazada desde index.html). No se cambian media/disabled al navegar.
function loadLeaflet() {
    if (!leaflet) leaflet = Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
        .then(([module]) => { window.L = module.default ?? module; return window.L; })
        .catch(error => { leaflet = null; throw error; });
    return leaflet;
}

export function prepareRoute(route) {
    if (!modules.has(route.path)) {
        const pending = Promise.all([route.load(), ...(route.leaflet ? [loadLeaflet()] : [])])
            .then(([module]) => ({ ...route, Component: module.default }))
            .catch(error => { modules.delete(route.path); throw error; });
        modules.set(route.path, pending);
    }
    return modules.get(route.path);
}
