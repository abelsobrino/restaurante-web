import { adminMenu } from './adminMenu.js';

// Cada visita tiene sus propios controladores, DOM, eventos y temporizadores.
// Los servicios de Supabase y el almacenamiento mantienen su contrato original.
export function createPageScope(host, routeUrl, navigate, onError = console.error) {
    const realWindow = globalThis.window;
    const realDoc = realWindow.document;
    const own = Object.create(null);
    const ready = [];
    const disposers = [];
    const timers = new Set();
    const intervals = new Set();
    let active = true;
    const overflow = realDoc.body.style.overflow;
    const captured = new URL(routeUrl, realWindow.location.origin);
    const go = (target, options = {}) => { if (active) navigate(target, options); };
    const location = new Proxy({}, {
        get(_, prop) {
            if (prop === 'assign') return target => go(target);
            if (prop === 'replace') return target => go(target, { replace: true });
            if (prop === 'reload') return () => go(captured.href, { replace: true });
            if (prop === 'toString') return () => captured.href;
            const value = captured[prop];
            return typeof value === 'function' ? value.bind(captured) : value;
        },
        set(_, prop, value) {
            if (prop === 'href') { go(value); return true; }
            const next = new URL(captured.href); next[prop] = value; go(next.href); return true;
        }
    });
    function listen(target, type, callback, options) {
        if (!active) return;
        const wrapped = typeof callback === 'function' ? function(event) {
            if (active) return callback.call(this, event);
        } : { handleEvent(event) { if (active) callback?.handleEvent(event); } };
        target.addEventListener(type, wrapped, options);
        disposers.push(() => target.removeEventListener(type, wrapped, options));
    }
    const scopedStyle = new Proxy({}, {
        get(_, prop) { const value = realDoc.body.style[prop]; return typeof value === 'function' ? value.bind(realDoc.body.style) : value; },
        set(_, prop, value) { if (active) { realDoc.body.style[prop] = value; }
            return true; }
    });
    const body = new Proxy({}, {
        get(_, prop) {
            if (prop === 'style') return scopedStyle;
            if (['appendChild', 'append', 'prepend', 'removeChild', 'insertBefore'].includes(prop)) return host[prop].bind(host);
            const value = realDoc.body[prop];
            return typeof value === 'function' ? value.bind(realDoc.body) : value;
        }
    });
    const document = new Proxy({}, {
        get(_, prop) {
            if (prop === 'body') return body;
            if (prop === 'getElementById') return id => host.querySelector('#' + CSS.escape(String(id)));
            if (prop === 'querySelector' || prop === 'querySelectorAll') return host[prop].bind(host);
            if (prop === 'addEventListener') return (type, callback, options) => {
                if (type === 'DOMContentLoaded') ready.push(callback);
                else listen(realDoc, type, callback, options);
            };
            const value = realDoc[prop];
            return typeof value === 'function' ? value.bind(realDoc) : value;
        },
        set(_, prop, value) { if (active) { realDoc[prop] = value; }
            return true; }
    });
    // Los únicos globales escritos por los módulos son locales a esta visita.
    const scopedDb = realWindow.LaFondaDB && {
        ...realWindow.LaFondaDB,
        rpc(...args) {
            if (!active) return Promise.reject(new Error('La sección ya no está activa.'));
            return realWindow.LaFondaDB.rpc(...args);
        }
    };
    const window = new Proxy(own, {
        get(target, prop) {
            if (prop === 'location') return location;
            if (prop === 'LaFondaDB') return scopedDb;
            if (prop === 'document') return document;
            if (prop === 'addEventListener') return (type, callback, options) => listen(realWindow, type, callback, options);
            if (prop in target) return target[prop];
            const value = realWindow[prop];
            return typeof value === 'function' ? value.bind(realWindow) : value;
        },
        set(target, prop, value) { target[prop] = value; return true; }
    });
    function scopedTimeout(callback, delay, ...args) {
        if (!active) return;
        const id = realWindow.setTimeout(() => { timers.delete(id); if (active) callback(...args); }, delay);
        timers.add(id); return id;
    }
    function scopedInterval(callback, delay, ...args) {
        if (!active) return;
        const id = realWindow.setInterval(() => { if (active) callback(...args); }, delay);
        intervals.add(id); return id;
    }
    function clearTimeout(id) { timers.delete(id); realWindow.clearTimeout(id); }
    function clearInterval(id) { intervals.delete(id); realWindow.clearInterval(id); }
    function start() {
        // Mantiene el orden de carga original; los inicializadores async continúan
        // sin bloquear los demás, como DOMContentLoaded en el sitio anterior.
        for (const callback of ready) {
            if (!active) break;
            try { Promise.resolve(callback.call(document, new Event('DOMContentLoaded'))).catch(error => { if (active) onError(error); }); }
            catch (error) { if (active) onError(error); }
        }
        ready.length = 0;
    }
    function dispose() {
        if (!active) return;
        active = false;
        for (const id of timers) realWindow.clearTimeout(id);
        for (const id of intervals) realWindow.clearInterval(id);
        for (const fn of disposers.reverse()) { try { fn(); } catch (error) { console.warn('Limpieza de página:', error); } }
        timers.clear(); intervals.clear(); ready.length = 0;
        realDoc.body.style.overflow = overflow;
    }
    return { document, window, setTimeout: scopedTimeout, clearTimeout, setInterval: scopedInterval, clearInterval, adminMenu, start, dispose,
        onDispose(fn) { disposers.push(fn); }, get active() { return active; } };
}
