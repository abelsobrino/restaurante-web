import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { mensajeRPC } from '../services/mensajes.js';
import { normalizePath } from '../routes.js';
const links = [
    ['/paginas/nosotros/', 'SOBRE NOSOTROS', 'nav-nosotros'],
    ['/paginas/menu/carta/', 'CARTA', 'nav-carta'],
    ['/paginas/menu/galeria/', 'GALERÍA', 'nav-galeria'],
    ['/paginas/resenas/', 'RESEÑAS', 'nav-resenas'],
    ['/paginas/contacto/', 'CONTÁCTANOS', 'nav-contactanos']
];
export default function Navbar({ navigate, className = '' }) {
    const { pathname } = useLocation();
    const [session, setSession] = useState(() => window.LaFondaAuth?.getSession());
    const [mobile, setMobile] = useState(false);
    const [dropdown, setDropdown] = useState(false);
    const account = useRef(null);
    const [unread,setUnread]=useState(null);
    useEffect(() => {
        const refresh = () => setSession(window.LaFondaAuth?.getSession());
        const outside = event => { if (!account.current?.contains(event.target)) setDropdown(false); };
        const key = event => { if (event.key === 'Escape') { setDropdown(false); setMobile(false); } };
        for (const event of ['lafonda-session-change', 'lafonda-navbar-refresh', 'pageshow', 'storage']) window.addEventListener(event, refresh);
        document.addEventListener('click', outside); document.addEventListener('keydown', key);
        return () => { for (const event of ['lafonda-session-change', 'lafonda-navbar-refresh', 'pageshow', 'storage']) window.removeEventListener(event, refresh); document.removeEventListener('click', outside); document.removeEventListener('keydown', key); };
    }, []);
    useEffect(() => { setMobile(false); setDropdown(false); }, [pathname]);
    const role = String(session?.rol || '').toUpperCase();
    useEffect(() => {
        let alive=true, running=false;
        setUnread(null);
        if(role!=='CLIENTE') return;
        const refresh=async()=>{if(!alive||running||document.hidden)return;running=true;try{const n=await mensajeRPC('CLIENTE','lf_notificaciones_contar');if(alive)setUnread(Number.isSafeInteger(n)&&n>=0?n:null);}catch{if(alive)setUnread(null);}finally{running=false;}};
        refresh();const timer=window.setInterval(refresh,60000);
        window.addEventListener('lafonda-notificaciones-change',refresh);document.addEventListener('visibilitychange',refresh);
        return()=>{alive=false;window.clearInterval(timer);window.removeEventListener('lafonda-notificaciones-change',refresh);document.removeEventListener('visibilitychange',refresh);};
    },[role,session?.id,session?.email,session?.password]);
    const admin = role === 'ADMIN';
    const adminMode = admin && String(session?.modo || '').toUpperCase() === 'ADMIN';
    const name = String(session?.nombre || '').trim().split(/\s+/)[0] || String(session?.email || '').split('@')[0] || 'Cuenta';
    const active = to => normalizePath(pathname) === normalizePath(to) ? 'nav-link active' : 'nav-link';
    const close = () => { setMobile(false); setDropdown(false); };
    const changeMode = event => {
        event.preventDefault(); close();
        const mode = adminMode ? 'CLIENTE' : 'ADMIN';
        if (window.LaFondaAuth.setMode(mode)) navigate(mode === 'ADMIN' ? '/paginas/administrador/panel/' : '/');
    };
    const logout = event => { event.preventDefault(); close(); window.LaFondaAuth.logout(); };
    return <div id="global-nav" className={className}>
        <header className="main-header"><div className="container header-container">
            <div className="logo"><Link to="/" className="logo-link" aria-label="Ir al inicio" onClick={close}><img src="/imagenes/logo/logo.webp" alt="La Fonda" className="logo-img" /></Link></div>
            <nav className="main-nav" aria-label="Navegación principal">
                <button type="button" className={`nav-toggle${mobile ? ' active' : ''}`} id="nav-btn-toggle" aria-label={mobile ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobile} aria-controls="nav-menu-list" onClick={() => setMobile(v => !v)}><span className="bar"/><span className="bar"/><span className="bar"/></button>
                <ul className={`nav-list${mobile ? ' open' : ''}`} id="nav-menu-list">
                    {links.map(([to,label,id]) => <li key={id}><Link to={to} id={id} className={active(to)} aria-current={active(to).includes('active') ? 'page' : undefined} onClick={close}>{label}</Link></li>)}
                    <li id="nav-admin-item" hidden={!adminMode}><Link to="/paginas/administrador/panel/" className={active('/paginas/administrador/panel/')} onClick={close}>ADMIN</Link></li>
                    {role==='CLIENTE'&&<li className="lf-nav-notifications"><Link to="/paginas/notificaciones/" className={active('/paginas/notificaciones/')+' lf-nav-bell'} aria-label={unread===null?'Notificaciones':`Notificaciones: ${unread} sin leer`} title="Notificaciones" onClick={close}><i className="fa-regular fa-bell" aria-hidden="true"/>{unread>0&&<span className="lf-nav-count">{unread>99?'99+':unread}</span>}</Link></li>}
                    <li className="nav-user-item" ref={account}>
                        <button type="button" className={`nav-user-btn${session ? ' logged-in' : ''}`} id="nav-user-btn" aria-label="Mi cuenta" aria-expanded={dropdown} aria-controls="user-dropdown" onClick={() => setDropdown(v => !v)}><span className="user-icon"><i className="fa-regular fa-user"/></span><span className="user-label" id="user-display-name">{name}</span><span className="user-arrow"><i className="fa-solid fa-caret-down"/></span></button>
                        <ul id="user-dropdown" className={`user-dropdown${dropdown ? ' open' : ''}`}>
                            <li><Link id="dropdown-profile" to={session ? '/paginas/perfil/' : '/paginas/acceso/iniciar-sesion/'} onClick={close}><i className="fa-regular fa-user"/><span>{session ? 'Mi perfil' : 'Iniciar sesión'}</span></Link></li>
                            <li id="dropdown-pedidos-row" hidden={role !== 'CLIENTE'}><Link id="dropdown-pedidos" to="/paginas/pedidos/mis-pedidos/" onClick={close}><i className="fa-solid fa-box"/><span>Mis pedidos</span></Link></li>
                            <li id="dropdown-reservas-row" hidden={role !== 'CLIENTE'}><Link id="dropdown-reservas" to="/paginas/reservas/mis-reservas/" onClick={close}><i className="fa-regular fa-calendar"/><span>Mis reservas</span></Link></li>
                            <li id="dropdown-mode-row" hidden={!admin}><a href="#" id="dropdown-mode" onClick={changeMode}><i className={adminMode ? 'fa-solid fa-store' : 'fa-solid fa-shield-halved'}/><span>{adminMode ? 'Ver como usuario' : 'Volver a administración'}</span></a></li>
                            <li id="dropdown-divider-row" hidden={!session}><hr className="dropdown-divider"/></li>
                            <li id="dropdown-logout-row" hidden={!session}><a href="#" id="dropdown-logout" className="logout-link" onClick={logout}><i className="fa-solid fa-right-from-bracket"/><span>Cerrar sesión</span></a></li>
                        </ul>
                    </li>
                </ul>
            </nav>
        </div></header>
    </div>;
}
