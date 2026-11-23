import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularLimitesCarrito } from '../src/services/floating-cart.js';

const leer = ruta => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');

test('las hojas se activan durante el montaje, no antes de reemplazar la pantalla anterior', () => {
    const app = leer('src/App.jsx');
    const preparar = app.indexOf('prepareRoute(route).then(prepared =>');
    const mostrar = app.indexOf('setDisplay({ ...prepared', preparar);
    const activar = app.indexOf('useInsertionEffect(() => {');
    assert.ok(preparar >= 0 && mostrar > preparar && activar > mostrar);
    assert.doesNotMatch(app.slice(preparar, mostrar), /activateStyles\(/);
    assert.match(app.slice(activar), /activateStyles\(display\.styles\)/);
    assert.match(app, /stylesReady\(display\.styles\)/);
    assert.match(app, /requestAnimationFrame\(\(\) => \{[\s\S]*?requestAnimationFrame\(\(\) => \{/);
});

test('la pantalla nunca muestra contenido sin CSS mientras carga una ruta', () => {
    const app = leer('src/App.jsx');
    const styles = leer('public/css/mensajes.css');
    assert.match(app, /display\.target !== target/);
    assert.match(app, /visibility: transitioning \? 'hidden' : 'visible'/);
    assert.match(app, /transitioning && Page && <div className="lf-route-transition"/);
    assert.match(app, /aria-label="Preparando sección"/);
    assert.match(styles, /\.lf-route-transition\s*\{[\s\S]*?position:\s*fixed/);
    assert.match(styles, /z-index:\s*970/);
    assert.match(styles, /body\.lf-has-mobile-switch \.lf-route-transition/);
    assert.match(styles, /\.lf-route-scene\[aria-hidden="true"\]\s*\{\s*visibility:\s*hidden\s*!important/);
    assert.doesNotMatch(leer('public/css/general.css'), /@view-transition/);
});

test('la campana móvil requiere sesión y el enlace de escritorio dice RESERVAR', () => {
    const nav = leer('src/components/Navbar.jsx');
    assert.match(nav, /\{session && <Link className="lf-header-mobile-bell"/);
    assert.match(nav, /'RESERVAR', 'nav-reservar'/);
    assert.doesNotMatch(nav, /'RESERVAR MESA', 'nav-reservar'/);
    assert.match(nav, /\{role === 'CLIENTE' && <li className="lf-nav-notifications"/);
});

test('los iconos Font Awesome se cargan como hoja de estilo en head', () => {
    const html = leer('index.html');
    assert.match(html, /rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/);
    assert.doesNotMatch(leer('public/css/general.css'), /@import url\("https:\/\/cdnjs\.cloudflare\.com/);
});

test('el carrito se calcula con margen visible en móviles pequeños', () => {
    const limits = calcularLimitesCarrito({
        anchoPantalla: 320, altoPantalla: 640, anchoBoton: 58, altoBoton: 58,
        limiteSuperior: 126, inicioBarraInferior: 560
    });
    assert.equal(limits.maxX, 238);
    assert.equal(limits.maxY, 480);
    assert.ok(limits.maxX + 58 <= 320 - 24);
    assert.ok(limits.maxY + 58 <= 560 - 22);
    const src = leer('src/services/floating-cart.js');
    const css = leer('public/paginas/menu/carta/carta.css');
    assert.match(src, /data-cart-ready/);
    assert.match(src, /lafonda-carrito-flotante-pos-v2/);
    assert.match(css, /\.mobile-cart-btn:not\(\[data-cart-ready="true"\]\)\s*\{\s*visibility:\s*hidden/);
});
