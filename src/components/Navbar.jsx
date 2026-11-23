import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { mensajeRPC } from '../services/mensajes.js';
import { normalizePath } from '../routes.js';

const desktopLinks = [
    ['/paginas/nosotros/', 'SOBRE NOSOTROS', 'nav-nosotros'],
    ['/paginas/menu/carta/', 'CARTA', 'nav-carta'],
    ['/paginas/menu/galeria/', 'GALERÍA', 'nav-galeria'],
    ['/paginas/resenas/', 'RESEÑAS', 'nav-resenas'],
    ['/paginas/contacto/', 'CONTÁCTANOS', 'nav-contactanos'],
    ['/paginas/reservas/nueva-reserva/', 'RESERVAR', 'nav-reservar']
];

// Cinco accesos; los tres centrales agrupan rutas que ya existían.
const mobileTabs = [
    { path: '/', label: 'Inicio', icon: 'fa-solid fa-house', paths: ['/'] },
    { path: '/paginas/menu/carta/', label: 'Carta y carrito', icon: 'fa-solid fa-cart-shopping', paths: ['/paginas/menu/carta/', '/paginas/pedidos/carrito/'] },
    { path: '/paginas/menu/galeria/', label: 'Reseñas y fotos', icon: 'fa-regular fa-images', paths: ['/paginas/menu/galeria/', '/paginas/resenas/'] },
    { path: '/paginas/reservas/nueva-reserva/', label: 'Reserva y contacto', icon: 'fa-regular fa-calendar-check', paths: ['/paginas/reservas/nueva-reserva/', '/paginas/contacto/'] },
    { path: '/paginas/perfil/', label: 'Cuenta', icon: 'fa-regular fa-circle-user', paths: ['/paginas/perfil/', '/paginas/pedidos/mis-pedidos/', '/paginas/reservas/mis-reservas/', '/paginas/acceso/iniciar-sesion/', '/paginas/acceso/registrarse/', '/paginas/acceso/elegir-modo/'] }
];

const sectionGroups = [
    { paths: ['/paginas/menu/carta/', '/paginas/pedidos/carrito/'], items: [
        ['/paginas/menu/carta/', 'Carta', 'fa-solid fa-utensils'],
        ['/paginas/pedidos/carrito/', 'Carrito', 'fa-solid fa-cart-shopping']
    ]},
    { paths: ['/paginas/menu/galeria/', '/paginas/resenas/'], items: [
        ['/paginas/menu/galeria/', 'Fotos', 'fa-regular fa-images'],
        ['/paginas/resenas/', 'Reseñas', 'fa-regular fa-star']
    ]},
    { paths: ['/paginas/reservas/nueva-reserva/', '/paginas/contacto/'], items: [
        ['/paginas/reservas/nueva-reserva/', 'Reservar mesa', 'fa-regular fa-calendar-check'],
        ['/paginas/contacto/', 'Contacto', 'fa-regular fa-envelope']
    ]}
];

export default function Navbar({ navigate, className = '', visiblePath }) {
    const { pathname } = useLocation();
    const current = normalizePath(visiblePath || pathname);
    const [session, setSession] = useState(() => window.LaFondaAuth?.getSession());
    const [dropdown, setDropdown] = useState(false);
    const [unread, setUnread] = useState(null);
    const account = useRef(null);
    const role = String(session?.rol || '').toUpperCase();
    const isAdmin = role === 'ADMIN';
    const isAdminMode = isAdmin && String(session?.modo || '').toUpperCase() === 'ADMIN';
    const group = sectionGroups.find(item => item.paths.includes(current));

    useEffect(() => {
        const refresh = () => setSession(window.LaFondaAuth?.getSession());
        const outside = event => { if (!account.current?.contains(event.target)) setDropdown(false); };
        const key = event => { if (event.key === 'Escape') setDropdown(false); };
        for (const name of ['lafonda-session-change', 'lafonda-navbar-refresh', 'pageshow', 'storage']) window.addEventListener(name, refresh);
        document.addEventListener('click', outside);
        document.addEventListener('keydown', key);
        return () => {
            for (const name of ['lafonda-session-change', 'lafonda-navbar-refresh', 'pageshow', 'storage']) window.removeEventListener(name, refresh);
            document.removeEventListener('click', outside);
            document.removeEventListener('keydown', key);
        };
    }, []);
    useEffect(() => { setDropdown(false); }, [pathname]);
    useLayoutEffect(() => {
        document.body.classList.toggle('lf-has-mobile-switch', Boolean(group));
        return () => document.body.classList.remove('lf-has-mobile-switch');
    }, [group]);
    useEffect(() => {
        let alive = true, running = false;
        setUnread(null);
        if (role !== 'CLIENTE') return;
        const refresh = async () => {
            if (!alive || running || document.hidden) return;
            running = true;
            try {
                const n = await mensajeRPC('CLIENTE', 'lf_notificaciones_contar');
                if (alive) setUnread(Number.isSafeInteger(n) && n >= 0 ? n : null);
            } catch { if (alive) setUnread(null); }
            finally { running = false; }
        };
        refresh();
        const timer = window.setInterval(refresh, 60000);
        window.addEventListener('lafonda-notificaciones-change', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            alive = false;
            window.clearInterval(timer);
            window.removeEventListener('lafonda-notificaciones-change', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [role, session?.id, session?.email, session?.password]);

    const name = String(session?.nombre || '').trim().split(/\s+/)[0] || String(session?.email || '').split('@')[0] || 'Cuenta';
    const active = to => current === normalizePath(to) ? 'nav-link active' : 'nav-link';
    const close = () => setDropdown(false);
    const changeMode = event => {
        event.preventDefault(); close();
        const mode = isAdminMode ? 'CLIENTE' : 'ADMIN';
        if (window.LaFondaAuth.setMode(mode)) navigate(mode === 'ADMIN' ? '/paginas/administrador/panel/' : '/');
    };
    const logout = event => { event.preventDefault(); close(); window.LaFondaAuth.logout(); };
    const bellHref = role === 'CLIENTE' ? '/paginas/notificaciones/' : isAdminMode ? '/paginas/administrador/contacto/' : isAdmin ? '/paginas/acceso/elegir-modo/' : '/paginas/acceso/iniciar-sesion/';
    const bellTitle = role === 'CLIENTE' ? (unread === null ? 'Notificaciones' : `Notificaciones: ${unread} sin leer`) : isAdmin ? 'Mensajes del administrador' : 'Iniciar sesión para ver notificaciones';
    const mobileAccountHref = session ? '/paginas/perfil/' : '/paginas/acceso/iniciar-sesion/';
    const mobileAccountPaths = [...mobileTabs[4].paths, ...(isAdmin ? ['/paginas/administrador/panel/', '/paginas/administrador/contacto/'] : [])];
    return <div id="global-nav" className={className}>
        <header className="main-header"><div className="container header-container">
            <div className="logo"><Link to="/" className="logo-link" aria-label="Ir al inicio" onClick={close}><img src="/imagenes/logo/logo.webp" alt="La Fonda" className="logo-img" /></Link></div>
            {session && <Link className="lf-header-mobile-bell" to={bellHref} aria-label={bellTitle} title={bellTitle} onClick={close}>
                <i className="fa-regular fa-bell" aria-hidden="true"/>
                {role === 'CLIENTE' && unread > 0 && <span className="lf-nav-count">{unread > 99 ? '99+' : unread}</span>}
            </Link>}
            <nav className="main-nav" aria-label="Navegación principal de escritorio">
                <ul className="nav-list" id="nav-menu-list">
                    {desktopLinks.map(([to,label,id]) => <li key={id}><Link to={to} id={id} className={active(to)} aria-current={active(to).includes('active') ? 'page' : undefined} onClick={close}>{label}</Link></li>)}
                    <li id="nav-admin-item" hidden={!isAdminMode}><Link to="/paginas/administrador/panel/" className={active('/paginas/administrador/panel/')} onClick={close}>ADMIN</Link></li>
                    {role === 'CLIENTE' && <li className="lf-nav-notifications"><Link to="/paginas/notificaciones/" className={active('/paginas/notificaciones/') + ' lf-nav-bell'} aria-label={bellTitle} title="Notificaciones" onClick={close}><i className="fa-regular fa-bell" aria-hidden="true"/>{unread > 0 && <span className="lf-nav-count">{unread > 99 ? '99+' : unread}</span>}</Link></li>}
                    <li className="nav-user-item" ref={account}>
                        <button type="button" className={`nav-user-btn${session ? ' logged-in' : ''}`} id="nav-user-btn" aria-label="Mi cuenta" aria-expanded={dropdown} aria-controls="user-dropdown" onClick={() => setDropdown(v => !v)}><span className="user-icon"><i className="fa-regular fa-user"/></span><span className="user-label" id="user-display-name">{name}</span><span className="user-arrow"><i className="fa-solid fa-caret-down"/></span></button>
                        <ul id="user-dropdown" className={`user-dropdown${dropdown ? ' open' : ''}`}>
                            <li><Link id="dropdown-profile" to={mobileAccountHref} onClick={close}><i className="fa-regular fa-user"/><span>{session ? 'Mi perfil' : 'Iniciar sesión'}</span></Link></li>
                            <li id="dropdown-pedidos-row" hidden={role !== 'CLIENTE'}><Link id="dropdown-pedidos" to="/paginas/pedidos/mis-pedidos/" onClick={close}><i className="fa-solid fa-box"/><span>Mis pedidos</span></Link></li>
                            <li id="dropdown-reservas-row" hidden={role !== 'CLIENTE'}><Link id="dropdown-reservas" to="/paginas/reservas/mis-reservas/" onClick={close}><i className="fa-regular fa-calendar"/><span>Mis reservas</span></Link></li>
                            <li id="dropdown-mode-row" hidden={!isAdmin}><a href="#" id="dropdown-mode" onClick={changeMode}><i className={isAdminMode ? 'fa-solid fa-store' : 'fa-solid fa-shield-halved'}/><span>{isAdminMode ? 'Ver como usuario' : 'Volver a administración'}</span></a></li>
                            <li id="dropdown-divider-row" hidden={!session}><hr className="dropdown-divider"/></li>
                            <li id="dropdown-logout-row" hidden={!session}><a href="#" id="dropdown-logout" className="logout-link" onClick={logout}><i className="fa-solid fa-right-from-bracket"/><span>Cerrar sesión</span></a></li>
                        </ul>
                    </li>
                </ul>
            </nav>
        </div></header>
        {group && <nav className="lf-mobile-group-switch" aria-label="Opciones de esta sección">
            {group.items.map(([to, label, icon]) => <Link to={to} key={to} className={current === normalizePath(to) ? 'active' : ''} aria-current={current === normalizePath(to) ? 'page' : undefined}>
                <i className={icon} aria-hidden="true"/> <span>{label}</span>
            </Link>)}
        </nav>}
        <nav className="lf-mobile-tabs" aria-label="Accesos rápidos móviles">
            {mobileTabs.map(tab => {
                const paths = tab.label === 'Cuenta' ? mobileAccountPaths : tab.paths;
                const selected = paths.includes(current) || (tab.label === 'Cuenta' && current.startsWith('/paginas/administrador/'));
                return <Link key={tab.label} to={tab.label === 'Cuenta' ? mobileAccountHref : tab.path} className={`lf-mobile-tab${selected ? ' active' : ''}`}
                    aria-current={selected ? 'page' : undefined}>
                    <i className={tab.icon} aria-hidden="true"/><span>{tab.label}</span>
                </Link>;
            })}
        </nav>
    </div>;
}
