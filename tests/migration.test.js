import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { routes, normalizePath, findRoute } from '../src/routes.js';
import { createPageScope } from '../src/runtime/scope.js';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const inventory = JSON.parse(read('tests/fixtures/inventario-rutas.json'));

test('24 rutas históricas conservadas y dos rutas nuevas', () => {
    assert.equal(routes.length, 26);
    assert.equal(new Set(routes.map(r => r.path)).size, 26);
    assert.equal(normalizePath('/index.html'), '/');
    for (const r of inventory) {
        assert.equal(findRoute(r.path).name, r.name);
        assert.equal(findRoute(r.path + 'index.html').name, r.name);
        assert.ok(existsSync(new URL('../src/pages/' + r.name + '.jsx', import.meta.url)));
        for (const style of r.styles) assert.ok(existsSync(new URL('../public' + style, import.meta.url)), style);
        for (const controller of r.controllers) assert.ok(existsSync(new URL('../src/controllers/' + controller, import.meta.url)), controller);
    }
    assert.equal(findRoute('/no-existe'), undefined);
});
test('ocho módulos admin protegidos y llamadas RPC históricas conservadas', () => {
    assert.equal(routes.filter(r => r.admin).length, 8);
    const fileList = [...new Set(inventory.flatMap(r => r.controllers))].map(s => 'src/controllers/' + s);
    const files = [...fileList, 'src/services/auth.js', 'src/services/db.js'];
    const found = new Set(files.flatMap(f => [...read(f).matchAll(/(?:\.rpc|\brpc)\s*\(\s*["']([^"']+)/g)].map(m => m[1])));
    const audit = JSON.parse(read('tests/fixtures/inventario-rpc.json'));
    assert.deepEqual([...found].sort(), audit.rpc);
    assert.match(read('src/App.jsx'), /session\.rol !== 'ADMIN'/);
    assert.match(read('src/App.jsx'), /session\.modo !== 'ADMIN'/);
    assert.match(read('src/services/db.js'), /\/rest\/v1\/rpc\//);
});
test('estilos originales y recursos están separados de los controladores', () => {
    assert.ok(existsSync(new URL('../public/imagenes/logo/logo.webp', import.meta.url)));
    assert.equal(read('public/_redirects').trim(), '/* /index.html 200');
    assert.match(read('src/main.jsx'), /<BrowserRouter>/);
    assert.match(read('src/App.jsx'), /<Navbar/);
    assert.doesNotMatch(read('index.html'), /cargar-componentes|transiciones\.js/);
});
test('ciclo de vida: eventos, temporizadores, RPC tardío y redirecciones quedan aislados', async () => {
    const win = new EventTarget();
    const doc = new EventTarget();
    const host = { querySelector: s=>s, querySelectorAll:()=>[], appendChild:()=>{} };
    doc.body = { style: { overflow: '' } }; win.document = doc;
    win.location = { origin: 'https://test.invalid' };
    win.setTimeout = setTimeout; win.clearTimeout = clearTimeout;
    win.setInterval = setInterval; win.clearInterval = clearInterval;
    let calls = 0, nav = 0, ready = 0, events = 0, timers = 0, cleanup = 0;
    win.LaFondaDB = { rpc: async () => { calls++; return {ok:true}; } };
    globalThis.window = win; globalThis.CSS = { escape: s=>s };
    const scope = createPageScope(host, '/paginas/menu/carta/', ()=>nav++);
    scope.document.addEventListener('DOMContentLoaded', ()=>ready++);
    scope.document.addEventListener('keydown', ()=>events++);
    scope.window.addEventListener('storage', ()=>events++);
    scope.start(); assert.equal(ready,1);
    assert.equal(scope.document.getElementById('test'),'#test');
    scope.document.body.style.overflow='hidden';
    scope.window.location.href='/index.html'; assert.equal(nav,1);
    await scope.window.LaFondaDB.rpc('web_catalogo'); assert.equal(calls,1);
    doc.dispatchEvent(new Event('keydown')); assert.equal(events,1);
    scope.setTimeout(()=>timers++,10); scope.setInterval(()=>timers++,10);
    scope.onDispose(()=>cleanup++); scope.dispose(); scope.dispose();
    doc.dispatchEvent(new Event('keydown')); win.dispatchEvent(new Event('storage'));
    scope.window.location.href='/index.html';
    await assert.rejects(scope.window.LaFondaDB.rpc('web_crear_pedido'));
    await new Promise(r=>setTimeout(r,25));
    assert.equal(events,1); assert.equal(timers,0); assert.equal(nav,1); assert.equal(calls,1); assert.equal(cleanup,1);
    assert.equal(doc.body.style.overflow,'');
    delete globalThis.window; delete globalThis.CSS;
});
