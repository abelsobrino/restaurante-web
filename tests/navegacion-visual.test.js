import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularLimitesCarrito } from '../src/services/floating-cart.js';

const leer = ruta => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');

test('los estilos de la ruta se activan antes del montaje de controladores', () => {
    const app = leer('src/App.jsx');
    const inicio = app.indexOf('prepareRoute(route).then(prepared =>');
    const activar = app.indexOf('activateStyles(prepared.styles)', inicio);
    const pintar = app.indexOf('setDisplay({ ...prepared', inicio);
    assert.ok(inicio >= 0 && activar > inicio && pintar > activar);
    assert.match(app, /document\.documentElement\.offsetHeight/);
    assert.match(app, /requestAnimationFrame\(\(\) => \{[\s\S]*?requestAnimationFrame\(\(\) => setPending\(false\)\)/);
});

test('navegación SPA protege visualmente la pantalla mientras se activa CSS', () => {
    const app = leer('src/App.jsx');
    const styles = leer('public/css/mensajes.css');
    assert.match(app, /display\.target !== target/);
    assert.match(app, /transitioning && Page && <div className="lf-route-transition"/);
    assert.match(app, /aria-label="Preparando sección"/);
    assert.match(styles, /\.lf-route-transition\s*\{[\s\S]*?position:\s*fixed/);
    assert.match(styles, /z-index:\s*970/);
    assert.match(styles, /body\.lf-has-mobile-switch \.lf-route-transition/);
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
