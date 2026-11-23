import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { safeGalleryImageURL } from '../src/services/safe-image-url.js';

const authCode = readFileSync(new URL('../src/services/auth.js', import.meta.url), 'utf8');
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function store(initial = []) {
    const data = new Map(initial);
    return {
        getItem: key => data.get(key) ?? null,
        setItem: (key, val) => data.set(key, String(val)),
        removeItem: key => data.delete(key),
        dump: () => JSON.stringify([...data])
    };
}

function authEnv({ sessionStorage = store(), localStorage = store(), result = { ok:true, id:10, nombre:'Ejemplo', email:'cliente@ejemplo.test', rol:'CLIENTE' } } = {}) {
    const events = [];
    const calls = [];
    const win = {
        dispatchEvent: e => events.push(e),
        LaFondaDB: {
            rpc: async (...args) => {
                calls.push(args);
                return typeof result === 'function' ? result(...args) : result;
            }
        },
        location: { pathname:'/paginas/perfil/' },
        LaFondaNavigate: () => {}
    };
    class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
    runInNewContext(authCode, {window:win,sessionStorage,localStorage,CustomEvent,Date,Error,console});
    return { auth:win.LaFondaAuth,sessionStorage,localStorage,events,calls,win };
}

test('seguridad: la contraseña no se guarda en storage ni aparece en la sesión pública o en eventos', async () => {
    const env = authEnv();
    const publicSession = await env.auth.login('cliente@ejemplo.test', 'ClaveSecreta!123');
    assert.equal(publicSession.email, 'cliente@ejemplo.test');
    assert.ok(!('password' in publicSession));
    assert.ok(!('password' in env.auth.getSession()));
    assert.ok(!env.sessionStorage.dump().includes('ClaveSecreta!123'));
    assert.ok(!env.localStorage.dump().includes('ClaveSecreta!123'));
    assert.ok(!JSON.stringify(env.events).includes('ClaveSecreta!123'));
    assert.equal(env.auth.credentials('CLIENTE').password, 'ClaveSecreta!123');
    assert.equal(env.calls[0][0], 'web_login');
    assert.equal(env.calls[0][1].p_password, 'ClaveSecreta!123');
    publicSession.rol = 'ADMIN';
    assert.equal(env.auth.getSession().rol, 'CLIENTE');
    assert.throws(() => env.auth.credentials('ADMIN'), /administrador/i);
});

test('seguridad: administrador cambia de modo sin persistir contraseña y logout borra todo', async () => {
    const env = authEnv({result:{ok:true,id:1,email:'admin@ejemplo.test',rol:'ADMIN',nombre:'Admin'}});
    await env.auth.login('admin@ejemplo.test', 'OtraClaveMuyLarga!');
    assert.equal(env.auth.getSession().modo, null);
    assert.equal(env.auth.setMode('ADMIN').modo, 'ADMIN');
    assert.equal(env.auth.credentials('ADMIN').password, 'OtraClaveMuyLarga!');
    assert.equal(env.auth.setMode('CLIENTE').modo, 'CLIENTE');
    assert.ok(!env.localStorage.dump().includes('OtraClaveMuyLarga!'));
    env.auth.clearSession();
    assert.equal(env.auth.getSession(), null);
    assert.equal(env.localStorage.getItem('la_fonda_user'), null);
    assert.throws(() => env.auth.credentials(), /Inicia sesión/);
});

test('seguridad: elimina contraseñas antiguas y tras recarga completa exige autenticarse de nuevo', async () => {
    const sessionStorage = store([['lafonda_web_session', JSON.stringify({ email:'cliente@ejemplo.test',password:'vieja-clave' })]]);
    const localStorage = store([['la_fonda_user', JSON.stringify({email:'cliente@ejemplo.test'})]]);
    const initial = authEnv({sessionStorage, localStorage});
    assert.equal(sessionStorage.getItem('lafonda_web_session'), null);
    assert.equal(localStorage.getItem('la_fonda_user'), null);
    await initial.auth.login('cliente@ejemplo.test', 'claveNueva');
    const refresh = authEnv({sessionStorage, localStorage});
    assert.equal(refresh.auth.getSession(), null);
    assert.throws(() => refresh.auth.credentials(), /Inicia sesión/);
});

test('seguridad: autenticación incorrecta no crea sesión ni conserva secretos', async () => {
    const env = authEnv({result:{ok:false,mensaje:'Usuario o contraseña incorrectos'}});
    await assert.rejects(env.auth.login('nadie@ejemplo.test','incorrecta'), /incorrectos/);
    assert.equal(env.auth.getSession(), null);
    assert.ok(!env.localStorage.dump().includes('incorrecta'));
});

test('seguridad: URL de galería no permite romper atributos ni protocolos ejecutables', () => {
    for (const url of [
        'javascript:alert(1)',
        'data:text/html;base64,PHNjcmlwdD4=',
        'data:image/svg+xml;base64,PHN2Zy8+',
        'https://sitio.test/foto.jpg" onerror="alert(1)',
        '//malicioso.test/x.png',
        '/imagen.png" onload="alert(1)'
    ]) assert.equal(safeGalleryImageURL(url), '/imagenes/logo/logo.webp');
    assert.equal(safeGalleryImageURL('https://ejemplo.test/foto.jpg'), 'https://ejemplo.test/foto.jpg');
    assert.equal(safeGalleryImageURL('data:image/png;base64,YWJj'), 'data:image/png;base64,YWJj');
    const gallery = read('src/controllers/paginas__menu__galeria__galeria.js');
    assert.match(gallery, /galeriaEscapar\(safeGalleryImageURL\(publicacion\.imagen\)\)/);
    assert.match(gallery, /imagen\.src\s*=\s*safeGalleryImageURL\(publicacion\.imagen\)/);
});

test('seguridad: no quedan referencias a session.password en controladores', () => {
    for (const name of [
        'paginas__administrador__admin.js',
        'paginas__pedidos__carrito__carrito.js',
        'paginas__pedidos__mis-pedidos__mis-pedidos.js',
        'paginas__menu__galeria__galeria.js',
        'paginas__pagos__pasarela__pasarela.js',
        'paginas__resenas__resenas.js'
    ]) {
        assert.doesNotMatch(read('src/controllers/' + name), /\bsesion\.password\b/);
    }
    assert.doesNotMatch(read('src/components/Navbar.jsx'), /session\?\.password/);
});

test('seguridad: Netlify activa cabeceras y prepara CSP en modo evaluación sin romper rutas', () => {
    const config = read('netlify.toml');
    for (const name of ['X-Content-Type-Options','X-Frame-Options','Referrer-Policy','Permissions-Policy','Content-Security-Policy-Report-Only']) {
        assert.ok(config.includes(name + ' = '), name);
    }
    assert.match(config, /publish = "dist"/);
    assert.doesNotMatch(config, /^\s+Content-Security-Policy\s*=/m);
});


test('seguridad: las credenciales del administrador prevalecen sobre parámetros de formularios', () => {
    const admin = read('src/controllers/paginas__administrador__admin.js');
    assert.match(admin, /\.\.\.parametros,\s*\.\.\.credenciales\(\)/);
    const mensajes = read('src/services/mensajes.js');
    assert.match(mensajes, /\.\.\.datos,\s*\.\.\.cred/);
});
