import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('v2.0.15: Sobre nosotros retorna un componente visible, sin return vacío', () => {
    const jsx = read('src/pages/Nosotros.jsx');
    assert.match(jsx, /export default function Nosotros\(\)/);
    assert.match(jsx, /return\s*\(\s*<main className="nosotros">/);
    assert.doesNotMatch(jsx, /return\s*\r?\n\s*<main/);
    assert.match(jsx, /<\/main>\s*\);/);
});

test('v2.0.15: todas las secciones, fotografías y tarjetas de Nosotros se conservan', () => {
    const jsx = read('src/pages/Nosotros.jsx');
    for (const className of ['nosotros-presentacion','nosotros-historia','nosotros-identidad','nosotros-valores',
        'nosotros-visual-principal','nosotros-visual-detalle','historia-card','identidad-card','valor']) {
        assert.ok(jsx.includes(className), `Falta la sección ${className}`);
    }
    for (const image of ['equipo-brindis.jpg','equipo-preparacion.jpg']) {
        assert.ok(jsx.includes(image), `Falta la imagen ${image}`);
    }
    for (const heading of ['Buena comida','Ingredientes seleccionados','Atención cercana',
        'NUESTRA MISIÓN','NUESTRA VISIÓN','Calidad','Responsabilidad','Cercanía','Innovación']) {
        assert.ok(jsx.includes(heading), `Falta el texto ${heading}`);
    }
    assert.match(jsx, /historia\.map\(/);
    assert.match(jsx, /identidad\.map\(/);
    assert.match(jsx, /valores\.map\(/);
});

test('v2.0.15: fixtures SQL no se eliminan de Git, solo se omiten de duplicación Sonar', () => {
    const config = read('.sonarcloud.properties');
    const ignore = read('.gitignore');
    assert.match(config, /^sonar\.cpd\.exclusions=tests\/fixtures\/sql\/\*\*$/m);
    assert.doesNotMatch(ignore, /^sql\/$/m);
    assert.doesNotMatch(ignore, /^tests\/fixtures\/sql\/$/m);
    for (const file of ['tests/fixtures/sql/01_reservas.sql',
        'tests/fixtures/sql/01_mensajes.sql','tests/fixtures/sql/03_notificaciones_personalizadas.sql',
        'sql/01_v2.0.12_stock_horarios.sql']) {
        assert.ok(read(file).length > 200, `No está disponible ${file}`);
    }
});
