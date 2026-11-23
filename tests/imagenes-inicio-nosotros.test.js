import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const read = file => readFileSync(new URL('../'+file,import.meta.url),'utf8');
const image = file => statSync(new URL('../public/'+file,import.meta.url));

test('Inicio muestra imágenes originales optimizadas y accesos a todas las secciones',()=>{
    const jsx=read('src/pages/Inicio.jsx');
    const css=read('public/inicio.css');
    for(const route of ['/paginas/menu/carta/','/paginas/menu/galeria/','/paginas/reservas/nueva-reserva/','/paginas/perfil/','/paginas/nosotros/']) assert.ok(jsx.includes(route));
    for(const f of ['imagenes/la_fonda_real/burgers.jpg','imagenes/la_fonda_real/sushi.jpg','imagenes/la_fonda_real/equipo-brindis.jpg']) assert.ok(image(f).size>1000);
    assert.match(jsx,/fetchPriority="high"/);
    assert.match(jsx,/loading="lazy"/);
    assert.match(css,/\.inicio-visual-secundario/);
    assert.match(css,/@media \(max-width: 768px\)/);
});

test('Sobre nosotros emplea dos fotos existentes y mantiene todas sus secciones',()=>{
    const jsx=read('src/pages/Nosotros.jsx');
    const css=read('public/paginas/nosotros/nosotros.css');
    assert.match(jsx,/nosotros-visual-principal/);
    assert.match(jsx,/nosotros-visual-detalle/);
    assert.match(jsx,/equipo-brindis\.jpg/);
    assert.match(jsx,/equipo-preparacion\.jpg/);
    for(const cls of ['nosotros-historia','nosotros-identidad','nosotros-valores']) assert.ok(jsx.includes(cls));
    assert.match(css,/\.nosotros-visual-principal img/);
    assert.match(css,/@media \(max-width: 600px\)/);
});
