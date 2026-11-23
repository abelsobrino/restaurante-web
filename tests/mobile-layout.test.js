import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('el perfil oculta siempre los accesos exclusivos de administrador para un cliente', () => {
    const css = read('public/css/general.css');
    const perfil = read('public/paginas/perfil/perfil.css');
    const controller = read('src/controllers/paginas__perfil__perfil.js');
    const page = read('src/pages/Perfil.jsx');
    assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
    assert.match(perfil, /\.perfil-acceso-admin\[hidden\]/);
    assert.match(controller, /function configurarPerfilCliente\(/);
    assert.match(controller, /"perfil-acceso-admin"\s*\)\.hidden\s*=\s*true/);
    assert.match(controller, /"perfil-acceso-modo"\s*\)\.hidden\s*=\s*true/);
    assert.match(page, /id=\\"perfil-acceso-admin\\"/);
    assert.match(page, /id=\\"perfil-acceso-modo\\"/);
});

test('el encabezado móvil no agrega por duplicado espacio superior', () => {
    const css = read('public/componentes/navbar/navbar.css');
    const inicio = read('public/inicio.css');
    const carta = read('public/paginas/menu/carta/carta.css');
    assert.match(css, /--alto-navbar:\s*68px/);
    assert.match(css, /body\s*\{\s*padding-top:\s*0\s*!important/);
    assert.match(inicio, /\.inicio\s*\{\s*padding:\s*calc\(var\(--alto-navbar\) \+ 22px\)/);
    assert.match(carta, /\.carta-hero\s*\{\s*padding:\s*24px 0 24px/);
});

test('barra inferior móvil contiene cinco grupos, sin menú hamburguesa', () => {
    const jsx = read('src/components/Navbar.jsx');
    const css = read('public/componentes/navbar/navbar.css');
    assert.match(jsx, /const mobileTabs =/);
    assert.match(jsx, /aria-label="Accesos rápidos móviles"/);
    for (const label of ['Inicio', 'Carta y carrito', 'Reseñas y fotos', 'Reserva y contacto', 'Cuenta']) assert.ok(jsx.includes(`label: '${label}'`));
    assert.match(css, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
    assert.match(css, /\.main-nav, \.nav-toggle, \.nav-list \{ display: none !important/);
    assert.match(jsx, /fa-solid fa-house/);
    assert.match(jsx, /lf-header-mobile-bell/);
    assert.doesNotMatch(jsx, /className=\{`nav-toggle/);
    // Los enlaces administrativos nunca están en los cinco accesos del cliente.
    const tabs = jsx.split('const mobileTabs =')[1].split('const sectionGroups =')[0];
    assert.doesNotMatch(tabs, /\/administrador\//);
});

test('cada grupo tiene un selector accesible para sus dos funciones', () => {
    const jsx = read('src/components/Navbar.jsx');
    const css = read('public/componentes/navbar/navbar.css');
    assert.match(jsx, /const sectionGroups =/);
    for (const label of ['Carta', 'Carrito', 'Fotos', 'Reseñas', 'Reservar mesa', 'Contacto']) assert.ok(jsx.includes(`'${label}'`));
    assert.match(jsx, /aria-label="Opciones de esta sección"/);
    assert.match(jsx, /aria-current=\{current === normalizePath\(to\)/);
    assert.match(css, /body\.lf-has-mobile-switch main\.contacto/);
});
