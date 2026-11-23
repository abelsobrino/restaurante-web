import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { getPageCssFiles, generateRouteStyles, bundleFile, lafondaPageStyles } from '../build/route-styles.mjs';
import { routes } from '../src/routes.js';
import { prepareRoute } from '../src/runtime/resources.js';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('todos los estilos de 26 rutas se compilan en una sola hoja estática y cacheable', () => {
    const css = generateRouteStyles();
    const paths = getPageCssFiles();
    const declared = new Set(routes.flatMap(route => route.styles));
    assert.equal(routes.length, 26);
    assert.equal(paths.length, declared.size);
    for (const routeStyle of declared) {
        const path = paths.find(path => path.replaceAll('\\', '/').endsWith('/public' + routeStyle));
        assert.ok(path, `Falta CSS de ${routeStyle}`);
        assert.ok(statSync(path).size > 0, `CSS vacío en ${routeStyle}`);
    }
    assert.equal(readFileSync(bundleFile, 'utf8'), css);
    for (const className of ['carta', 'contacto', 'perfil', 'admin-page', 'inicio']) {
        assert.ok(css.includes('.' + className), `Falta selector .${className}`);
    }
    assert.ok(css.length > 100000);
});

test('hoja combinada bloquea el montaje inicial y las páginas no cambian links de CSS', () => {
    const html = read('index.html');
    assert.match(html, /<link rel="stylesheet" href="\/src\/styles\/route-pages\.css"/);
    assert.ok(html.indexOf('href="/src/styles/route-pages.css"') < html.indexOf('src="/src/main.jsx"'));
    const resources = read('src/runtime/resources.js');
    assert.doesNotMatch(resources, /createElement\(['"]link|\.media\s*=|activateStyles|stylesReady/);
    const app = read('src/App.jsx');
    assert.doesNotMatch(app, /useInsertionEffect|activateStyles|stylesReady|\.lf-route-transition|requestAnimationFrame/);
    assert.match(app, /setDisplay\(\{ \.\.\.prepared, target, key:/);
    assert.match(app, /<Navbar navigate=\{navigate\} visiblePath=\{display\?\.path\}/);
});

test('precarga de rutas conserva hojas estáticas sin inserciones o cambios de media', async () => {
    const originalDoc = globalThis.document;
    try {
        globalThis.document = { createElement() { throw new Error('No se debe crear stylesheet al navegar'); } };
        const a = { path: '/test-preload-a/', styles: ['/carta.css'], leaflet: false, load: async () => ({ default: () => null }) };
        const b = { path: '/test-preload-b/', styles: ['/perfil.css'], leaflet: false, load: async () => ({ default: () => null }) };
        const [pageA, pageB] = await Promise.all([prepareRoute(a), prepareRoute(b)]);
        assert.equal(pageA.path, a.path);
        assert.equal(pageB.path, b.path);
    } finally {
        if (originalDoc === undefined) delete globalThis.document;
        else globalThis.document = originalDoc;
    }
});

test('Vite regenera el CSS antes del build y vigila sus archivos fuente', () => {
    const plugin = lafondaPageStyles();
    const tracked = [];
    plugin.buildStart.call({ addWatchFile(file) { tracked.push(file); } });
    assert.deepEqual(tracked, getPageCssFiles());
    assert.equal(readFileSync(bundleFile, 'utf8'), generateRouteStyles());
});

test('estilos de impresión de comprobantes no modifican las tablas de reportes', () => {
    const css = read('public/paginas/pagos/boleta/boleta.css');
    assert.match(css, /body:has\(\.comprobante-pagina\) \.container/);
});
