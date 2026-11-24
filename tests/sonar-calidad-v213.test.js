import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('Sonar v2.0.13: Font Awesome se carga con SRI y CORS, sin cambiar la versión', () => {
    const html = read('index.html');
    assert.match(html, /font-awesome\/7\.3\.1\/css\/all\.min\.css" integrity="sha512-[A-Za-z0-9+/]+={0,2}" crossorigin="anonymous"/);
    assert.match(html, /referrerpolicy="no-referrer"/);
});

test('Sonar v2.0.13: cambio de modo y cierre de sesión son botones accesibles', () => {
    const nav = read('src/components/Navbar.jsx');
    for (const id of ['dropdown-mode', 'dropdown-logout']) {
        assert.match(nav, new RegExp(`<button type="button" id="${id}"`));
        assert.doesNotMatch(nav, new RegExp(`<a href="#" id="${id}"`));
    }
    const css = read('public/componentes/navbar/navbar.css');
    assert.match(css, /\.user-dropdown li button\s*\{/);
    assert.match(css, /\.user-dropdown li button:hover\s*\{/);
});

test('Sonar v2.0.13: se conservan componentes y controladores esenciales', () => {
    const files = readdirSync(new URL('src/controllers/', root));
    assert.ok(files.includes('paginas__menu__carta__carta.js'));
    assert.ok(files.includes('paginas__pedidos__carrito__carrito.js'));
    assert.ok(files.includes('paginas__reservas__nueva-reserva__nueva-reserva.js'));
    assert.match(read('src/components/Navbar.jsx'), /desktopLinks/);
    assert.match(read('src/components/Navbar.jsx'), /mobileTabs/);
});

test('Sonar v2.0.13: eliminación de asignaciones sin uso no altera las RPC', () => {
    const catalogo = read('src/controllers/paginas__menu__carta__carta.js');
    const reservas = read('src/controllers/paginas__reservas__nueva-reserva__nueva-reserva.js');
    assert.match(catalogo, /web_catalogo/);
    assert.match(reservas, /lf_crear_reserva/);
    assert.doesNotMatch(read('src/controllers/paginas__pedidos__mis-pedidos__mis-pedidos.js'), /\{ document, window, setTimeout, clearTimeout, setInterval, clearInterval \} = scope/);
});

test('Sonar v2.0.13: la sesión pública no conserva contraseñas', () => {
    const auth = read('src/services/auth.js');
    assert.match(auth, /delete publicSession\.password/);
    assert.doesNotMatch(auth, /sessionStorage\.setItem\(SESSION_KEY/);
});

test('Sonar v2.0.13: las animaciones respetan movimiento reducido', () => {
    assert.match(read('public/css/general.css'), /@media \(prefers-reduced-motion: reduce\)/);
});

test('Sonar v2.0.13: números y versiones consistentes', () => {
    const pkg = JSON.parse(read('package.json'));
    const lock = JSON.parse(read('package-lock.json'));
    assert.equal(pkg.version, '2.0.13');
    assert.equal(lock.version, '2.0.13');
    assert.equal(lock.packages[''].version, '2.0.13');
});
