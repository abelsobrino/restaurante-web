import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { findRoute } from './routes.js';
import { prepareRoute } from './runtime/resources.js';

function internalURL(value) {
    try {
        const url = new URL(value, window.location.href);
        return url.origin === window.location.origin && /^https?:$/.test(url.protocol) ? url : null;
    } catch { return null; }
}
export default function App() {
    const loc = useLocation();
    const routerNavigate = useNavigate();
    const routerRef = useRef(routerNavigate);
    routerRef.current = routerNavigate;
    const [display, setDisplay] = useState(null);
    const [failure, setFailure] = useState(null);
    const [retry, setRetry] = useState(0);
    const navigate = useCallback((value, options = {}) => {
        const url = internalURL(value);
        // No aceptar redirecciones externas desde return_to u otros datos de sesión.
        routerRef.current(url && findRoute(url.pathname) ? url.pathname + url.search + url.hash : '/', options);
    }, []);
    const onError = useCallback(error => { console.error('Error al iniciar la página:', error); setFailure({ message: 'No se pudo completar la carga de esta sección. Puedes volver a intentarlo.' }); }, []);
    useLayoutEffect(() => { window.LaFondaNavigate = navigate; return () => { delete window.LaFondaNavigate; }; }, [navigate]);
    const target = loc.pathname + loc.search + loc.hash;
    // Las rutas antiguas /index.html y /paginas/.../index.html siguen válidas.
    useEffect(() => {
        let cancelled = false;
        setFailure(null);
        const route = findRoute(loc.pathname);
        if (!route) { setDisplay(null); setFailure({message: 'La página solicitada no existe.'}); return; }
        if (route.cliente && window.LaFondaAuth?.getSession()?.rol !== "CLIENTE") {
            if (!window.LaFondaAuth?.getSession()) { sessionStorage.setItem("lafonda_return_to", loc.pathname); navigate("/paginas/acceso/iniciar-sesion/", {replace:true}); }
            else navigate("/", {replace:true});
            return;
        }
        if (route.admin) {
            const session = window.LaFondaAuth.getSession();
            if (!session || session.rol !== 'ADMIN') {
                sessionStorage.setItem('lafonda_return_to', loc.pathname);
                navigate('/paginas/acceso/iniciar-sesion/', { replace: true }); return;
            }
            if (session.modo !== 'ADMIN') { navigate('/paginas/acceso/elegir-modo/', { replace: true }); return; }
        }
        prepareRoute(route).then(prepared => {
            if (cancelled) return;
            // Mantener visible la pantalla anterior hasta que el nuevo módulo
            // React esté listo. El CSS global ya está presente desde el arranque.
            setDisplay({ ...prepared, target, key: loc.key + ':' + retry });
        }).catch(error => { if (!cancelled) onError(error); });
        return () => { cancelled = true; };
    }, [loc.pathname, loc.search, loc.hash, loc.key, target, retry, navigate, onError]);

    useLayoutEffect(() => {
        if (!display) return;
        document.title = display.title;
        const hash = new URL(display.target, window.location.origin).hash;
        if (hash) {
            try { document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(); } catch {}
        } else window.scrollTo({ top: 0, behavior: 'instant' });
    }, [display]);

    useEffect(() => {
        const link = event => event.target instanceof Element ? event.target.closest('a[href]') : null;
        const routeLink = anchor => {
            if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return null;
            const raw = anchor.getAttribute('href');
            if (!raw || raw.startsWith('#')) return null;
            const url = internalURL(anchor.href);
            return url && findRoute(url.pathname) ? url : null;
        };
        const click = event => {
            if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
            const url = routeLink(link(event)); if (!url) return;
            event.preventDefault(); navigate(url.href);
        };
        const prefetch = event => {
            if (navigator.connection?.saveData) return;
            const url = routeLink(link(event));
            if (url) { const route = findRoute(url.pathname); if (!route.admin || window.LaFondaAuth?.isAdmin()) prepareRoute(route).catch(() => {}); }
        };
        document.addEventListener('click', click); document.addEventListener('pointerover', prefetch); document.addEventListener('pointerdown', prefetch); document.addEventListener('focusin', prefetch);
        return () => { document.removeEventListener('click', click); document.removeEventListener('pointerover', prefetch); document.removeEventListener('pointerdown', prefetch); document.removeEventListener('focusin', prefetch); };
    }, [navigate]);
    const Page = display?.Component;
    const retryRoute = () => { setFailure(null); setRetry(n => n + 1); };
    return <>
        <Navbar navigate={navigate} visiblePath={display?.path} className={display?.navClass}/>
        {failure && <section role="alert" className="container" style={{ paddingBlock: 24 }}>
            <p>{failure.message}</p>
            <button type="button" onClick={retryRoute}>Reintentar</button>{' '}
            <button type="button" onClick={() => navigate('/')}>Volver al inicio</button>
        </section>}
        {Page ? <Page key={display.key} routeUrl={display.target} navigate={navigate} onError={onError}/>
            : !failure && <main aria-busy="true" className="container lf-route-loader lf-brand-loader">
                <img src="/imagenes/logo/logo.webp" alt=""/><output>Cargando La Fonda...</output>
            </main>}
        <Footer className={display?.footerClass}/>
    </>;
}
