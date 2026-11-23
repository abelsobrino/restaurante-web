import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularLimitesCarrito, configurarCarritoFlotante } from '../src/services/floating-cart.js';

const leer = ruta => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');

test('el carrito flotante queda entre el selector superior y la barra inferior', () => {
    const limites = calcularLimitesCarrito({
        anchoPantalla: 375, altoPantalla: 800, anchoBoton: 58, altoBoton: 58,
        limiteSuperior: 132, inicioBarraInferior: 720
    });
    assert.deepEqual(limites, { minX: 24, maxX: 293, minY: 152, maxY: 640 });
    const css = leer('public/paginas/menu/carta/carta.css');
    assert.match(css, /touch-action:\s*none/);
    assert.match(css, /112px \+ env\(safe-area-inset-bottom/);
    assert.match(css, /\.mobile-cart-btn\s*\{[\s\S]*?bottom:\s*calc\(112px/);
});

test('el botón se mueve y se limita al área segura sin navegar al arrastrarlo', () => {
    const eventos = new Map();
    const controles = {};
    const almacen = new Map();
    const boton = {
        style: {}, attributes: {}, offsetWidth: 58, offsetHeight: 58,
        setAttribute(nombre, valor) { this.attributes[nombre] = valor; },
        addEventListener(tipo, fn) { eventos.set(tipo, fn); },
        removeEventListener(tipo) { eventos.delete(tipo); },
        setPointerCapture(id) { this.captura = id; },
        hasPointerCapture(id) { return this.captura === id; },
        releasePointerCapture() { this.captura = null; }
    };
    const doc = {
        querySelector(selector) {
            const rects = { '.main-header': { bottom: 68 }, '.lf-mobile-group-switch': { bottom: 132 }, '.lf-mobile-tabs': { top: 720 } };
            return rects[selector] ? { getBoundingClientRect: () => rects[selector] } : null;
        }
    };
    const anterior = globalThis.document;
    globalThis.document = doc;
    const win = {
        innerWidth: 375, innerHeight: 800, location: { href: '/' },
        localStorage: { getItem: key => almacen.get(key), setItem: (key, value) => almacen.set(key, value) },
        addEventListener: (tipo, fn) => { controles[tipo] = fn; }
    };
    const scope = { window: win, document: doc, onDispose: fn => { scope.cleanup = fn; } };
    const enviar = (tipo, props = {}) => {
        const evento = { button: 0, pointerId: 1, clientX: 0, clientY: 0,
            preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...props };
        eventos.get(tipo)(evento);
        return evento;
    };
    try {
        configurarCarritoFlotante(boton, scope);
        assert.equal(boton.style.left, '281px');
        assert.equal(boton.style.top, '624px');
        assert.equal(boton.attributes['data-cart-ready'], 'true');
        enviar('pointerdown', { clientX: 340, clientY: 680 });
        enviar('pointermove', { clientX: -400, clientY: -500 });
        assert.equal(boton.style.left, '24px');
        assert.equal(boton.style.top, '152px');
        enviar('pointerup');
        const trasArrastre = enviar('click');
        assert.ok(trasArrastre.prevented);
        assert.equal(win.location.href, '/');
        enviar('click');
        assert.equal(win.location.href, '/paginas/pedidos/carrito/');
        enviar('keydown', { key: 'ArrowDown' });
        assert.equal(boton.style.top, '164px');
        assert.ok(almacen.size > 0);
        scope.cleanup();
        assert.equal(eventos.size, 0);
    } finally {
        if (anterior === undefined) delete globalThis.document;
        else globalThis.document = anterior;
    }
});

test('la navegación muestra RESERVAR en escritorio sin añadir otra pestaña móvil', () => {
    const nav = leer('src/components/Navbar.jsx');
    const desktop = nav.split('const desktopLinks =')[1].split('const mobileTabs =')[0];
    assert.match(desktop, /'RESERVAR', 'nav-reservar'/);
    assert.match(desktop, /\/paginas\/reservas\/nueva-reserva\//);
    assert.match(nav, /aria-label="Accesos rápidos móviles"/);
    assert.match(nav, /'Reserva y contacto'/);
});
