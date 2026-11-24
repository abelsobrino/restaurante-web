import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { safeGalleryImageURL } from '../src/services/safe-image-url.js';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const relativeLuminance = hex => {
    const n = hex.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255);
    const [r, g, b] = n.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return .2126 * r + .7152 * g + .0722 * b;
};
const contrast = (x, y) => {
    const a = relativeLuminance(x), b = relativeLuminance(y);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
};

test('Calidad v2.0.14: versiones y caché de CSS coherentes', () => {
    assert.equal(JSON.parse(read('package.json')).version, '2.0.14');
    const lock = JSON.parse(read('package-lock.json'));
    assert.equal(lock.version,'2.0.14');
    assert.equal(lock.packages[''].version,'2.0.14');
    assert.match(read('index.html'), /navbar\/navbar\.css\?v=2\.0\.14/);
    assert.match(read('index.html'), /horarios-avisos\.css\?v=2\.0\.14/);
});

test('Calidad v2.0.14: contraste suficiente en componentes de estados y reservas', () => {
    assert.ok(contrast('#e6b133','#272110') >= 4.5, 'Icono horario');
    assert.ok(contrast('#09200f','#33a051') >= 4.5, 'Moderación: publicado');
    assert.ok(contrast('#ffffff','#c62828') >= 4.5, 'Indicador del carrito');
});

test('Calidad v2.0.14: enlace de imágenes preserva validación de protocolos', () => {
    assert.equal(safeGalleryImageURL('javascript:alert(1)'), '/imagenes/logo/logo.webp');
    assert.equal(safeGalleryImageURL('data:text/html;base64,AA=='), '/imagenes/logo/logo.webp');
    assert.equal(safeGalleryImageURL('/imagenes/logo/logo.webp'), '/imagenes/logo/logo.webp');
    assert.equal(safeGalleryImageURL('https://ejemplo.com/imagen.jpg'), 'https://ejemplo.com/imagen.jpg');
});

test('Calidad v2.0.14: se conserva el backend y la validación de stock', () => {
    assert.match(read('src/controllers/paginas__menu__carta__carta.js'), /\.codePointAt\(/);
    assert.match(read('src/controllers/paginas__menu__carta__carta.js'), /validarProducto/);
    assert.match(read('src/controllers/paginas__reservas__nueva-reserva__nueva-reserva.js'), /lf_web_horarios_v1/);
    assert.match(read('src/services/stock.js'), /rpc/);
});
