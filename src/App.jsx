import React, { useCallback, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { findRoute } from './routes.js';
import { activateStyles, prepareRoute, stylesReady } from './runtime/resources.js';

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
    const [pending, setPending] = useState(true);
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
        if (!route) { setDisplay(null); setPending(false); setFailure({message: 'La página solicitada no existe.'}); return; }
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
        setPending(true);
        prepareRoute(route).then(prepared => {
            if (cancelled) return;
            // El CSS de la página anterior debe permanecer activo hasta el
            // MISMO commit en que se monta la nueva. Desactivarlo aquí causaba
            // un frame sin estilos en Safari durante la navegación.
            setDisplay({ ...prepared, target, key: loc.key + ':' + retry });
            // El siguiente commit activa los nuevos estilos de forma atómica.
        }).catch(error => { if (!cancelled) { setPending(false); onError(error); } });
        return () => { cancelled = true; };
    }, [loc.pathname, loc.search, loc.hash, loc.key, target, retry, navigate, onError]);
    // useInsertionEffect activa las hojas ANTES de los useLayoutEffect hijos
    // (PageView inicializa allí los controladores y mide sus posiciones).
    // Durante la preparación sigue visible el CSS de la página anterior.
    useInsertionEffect(() => {
        if (display && display.target === target) activateStyles(display.styles);
    }, [display, target]);

    useLayoutEffect(() => {
        if (!display || display.target !== target) return;
        document.title = display.title;
        const hash = new URL(display.target, window.location.origin).hash;
        if (hash) { try { document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(); } catch {} }
        else window.scrollTo({ top: 0, behavior: 'instant' });

        // Nunca destapar el contenido antes de que el navegador haya aplicado
        // y calculado los estilos de todas las hojas de esta ruta.
        let frame = 0;
        let attempts = 0;
        let cancelled = false;
        const reveal = () => {
            if (cancelled) return;
            // El CSS puede aparecer como descargado antes de aplicarse en iOS.
            if (!stylesReady(display.styles) && attempts++ < 30) {
                frame = window.requestAnimationFrame(reveal);
                return;
            }
            // Forzar recálculo y dejar pasar dos ciclos de renderizado.
            void document.documentElement.offsetHeight;
            frame = window.requestAnimationFrame(() => {
                frame = window.requestAnimationFrame(() => {
                    if (!cancelled) setPending(false);
                });
            });
        };
        frame = window.requestAnimationFrame(reveal);
        return () => { cancelled = true; window.cancelAnimationFrame(frame); };
    }, [display, target]);
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
    const transitioning = !failure && (pending || (display && display.target !== target));
    const retryRoute = () => { setFailure(null); setRetry(n => n + 1); };
    return <>
        <Navbar navigate={navigate} className={display?.navClass}/>

        {failure && <section role="alert" className="container" style={{paddingBlock:24}}><p>{failure.message}</p><button type="button" onClick={retryRoute}>Reintentar</button>{' '}<button type="button" onClick={() => navigate('/')}>Volver al inicio</button></section>}
        {Page ? <div className="lf-route-scene" style={{ visibility: transitioning ? 'hidden' : 'visible' }} aria-hidden={transitioning}>
            <Page key={display.key} routeUrl={display.target} navigate={navigate} onError={onError}/>
        </div> : !failure && <main aria-busy="true" className="container lf-route-loader lf-brand-loader"><img src="/imagenes/logo/logo.webp" alt=""/><span role="status">Cargando La Fonda...</span></main>}
        {transitioning && Page && <div className="lf-route-transition" role="status" aria-live="polite" aria-label="Preparando sección">
            <div className="lf-brand-loader"><img src="/imagenes/logo/logo.webp" alt=""/><span>Preparando La Fonda...</span></div>
        </div>}
        <Footer className={display?.footerClass}/>
    </>;
}
