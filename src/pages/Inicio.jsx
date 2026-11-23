import React from 'react';
import { Link } from 'react-router-dom';

const shortcuts = [
    { label: 'Carta y carrito', description: 'Elige tus platos y revisa tu pedido.', href: '/paginas/menu/carta/', icon: 'fa-solid fa-cart-shopping' },
    { label: 'Reseñas y fotos', description: 'Conoce las experiencias y nuestra galería.', href: '/paginas/menu/galeria/', icon: 'fa-regular fa-images' },
    { label: 'Reserva y contacto', description: 'Reserva tu mesa o comunícate con La Fonda.', href: '/paginas/reservas/nueva-reserva/', icon: 'fa-regular fa-calendar-check' },
    { label: 'Cuenta', description: 'Consulta pedidos, reservas y tu perfil.', href: '/paginas/perfil/', icon: 'fa-regular fa-circle-user' }
];

export default function Inicio() {
    return <main className="lf-home">
        <section className="inicio" aria-labelledby="inicio-titulo">
            <div className="container inicio-contenido">
                <div className="inicio-texto">
                    <p className="inicio-kicker">LA FONDA · SABOR PARA COMPARTIR</p>
                    <h1 id="inicio-titulo" className="inicio-titulo">Disfruta de comida <span className="highlight">fresca</span> a tu manera</h1>
                    <p className="inicio-descripcion">En La Fonda preparamos cada plato con dedicación, ingredientes seleccionados y el sabor que nos caracteriza. Descubre tu favorito y disfrútalo a tu ritmo.</p>
                    <div className="inicio-acciones">
                        <Link className="inicio-boton" to="/paginas/menu/carta/">Ver carta <i className="fa-solid fa-arrow-right" aria-hidden="true"/></Link>
                        <Link className="inicio-enlace" to="/paginas/nosotros/">Sobre nosotros <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"/></Link>
                    </div>
                </div>
                <div className="inicio-visual" aria-label="Selección de platos de La Fonda">
                    <div className="inicio-visual-principal">
                        <img src="/imagenes/la_fonda_real/burgers.jpg" alt="Hamburguesas artesanales y especialidades de La Fonda" fetchPriority="high" loading="eager" decoding="async"/>
                        <span className="inicio-visual-etiqueta"><i className="fa-solid fa-utensils" aria-hidden="true"/> Preparado para disfrutar</span>
                    </div>
                    <div className="inicio-visual-secundario">
                        <img src="/imagenes/la_fonda_real/sushi.jpg" alt="Variedad de platos servidos en La Fonda" loading="lazy" decoding="async"/>
                        <span>Sabores para descubrir</span>
                    </div>
                </div>
            </div>
        </section>
        <section className="inicio-accesos container" aria-labelledby="inicio-accesos-titulo">
            <div className="inicio-seccion-encabezado"><p>EXPLORA LA FONDA</p><h2 id="inicio-accesos-titulo">Accesos rápidos</h2></div>
            <div className="inicio-accesos-grid">
                {shortcuts.map(({ label, description, href, icon }) => <Link to={href} className="inicio-acceso" key={label}>
                    <span className="inicio-acceso-icono"><i className={icon} aria-hidden="true"/></span>
                    <span className="inicio-acceso-texto"><strong>{label}</strong><small>{description}</small></span>
                    <i className="fa-solid fa-arrow-right inicio-acceso-flecha" aria-hidden="true"/>
                </Link>)}
            </div>
            <div className="inicio-conocenos">
                <img src="/imagenes/la_fonda_real/equipo-brindis.jpg" alt="Equipo de La Fonda compartiendo un momento detrás de barra" loading="lazy" decoding="async"/>
                <div><p>DE NUESTRA COCINA A TU MESA</p><h2>Conoce más sobre La Fonda</h2><span>Conoce al equipo y el ambiente que hacen especial cada visita.</span><Link to="/paginas/nosotros/">Nuestra historia <i className="fa-solid fa-arrow-right" aria-hidden="true"/></Link></div>
            </div>
        </section>
    </main>;
}
