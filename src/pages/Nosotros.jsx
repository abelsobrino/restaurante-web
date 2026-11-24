import React from 'react';

// El contenido repetido se mantiene como datos para conservar la misma estructura
// visual sin duplicar bloques de marcado en cada tarjeta.
const historia = [
    {
        icono: 'fa-solid fa-utensils',
        titulo: 'Buena comida',
        descripcion: 'Preparamos cada pedido buscando mantener un equilibrio entre sabor, presentación y calidad.'
    },
    {
        icono: 'fa-solid fa-seedling',
        titulo: 'Ingredientes seleccionados',
        descripcion: 'Elegimos cuidadosamente nuestros ingredientes para ofrecer platos frescos y consistentes.'
    },
    {
        icono: 'fa-solid fa-heart',
        titulo: 'Atención cercana',
        descripcion: 'Queremos que nuestros clientes se sientan cómodos y disfruten cada experiencia con nosotros.'
    }
];

const identidad = [
    {
        numero: '01',
        etiqueta: 'NUESTRA MISIÓN',
        titulo: 'Crear buenos momentos alrededor de la comida',
        descripcion: 'Brindar una experiencia gastronómica agradable mediante platos preparados con dedicación, atención eficiente y un servicio pensado para nuestros clientes.'
    },
    {
        numero: '02',
        etiqueta: 'NUESTRA VISIÓN',
        titulo: 'Seguir creciendo junto a nuestros clientes',
        descripcion: 'Convertir a La Fonda en una alternativa reconocida por su sabor, atención y capacidad de adaptarse a nuevas formas de disfrutar nuestros platos.'
    }
];

const valores = [
    { numero: '01', titulo: 'Calidad', descripcion: 'Cuidamos nuestros ingredientes, preparación y presentación.' },
    { numero: '02', titulo: 'Responsabilidad', descripcion: 'Trabajamos para cumplir cada pedido correctamente y a tiempo.' },
    { numero: '03', titulo: 'Cercanía', descripcion: 'Escuchamos a nuestros clientes y buscamos brindar una atención amable.' },
    { numero: '04', titulo: 'Innovación', descripcion: 'Incorporamos nuevas herramientas y opciones para mejorar la experiencia del restaurante.' }
];

export default function Nosotros() {
    return (
        <main className="nosotros">
            <section className="nosotros-presentacion">
                <div className="container nosotros-presentacion-grid">
                    <div className="nosotros-presentacion-texto">
                        <p className="nosotros-kicker">CONOCE LA FONDA</p>
                        <h1 className="nosotros-titulo">Sobre <span className="highlight">Nosotros</span></h1>
                        <h2 className="nosotros-subtitulo">Sabor, tradición y buenos momentos.</h2>
                        <p className="nosotros-descripcion">
                            La Fonda nació con una idea sencilla: ofrecer comida preparada con dedicación,
                            ingredientes seleccionados y ese sabor especial que hace que quieras volver.
                        </p>
                        <p className="nosotros-descripcion">
                            Buscamos que cada visita sea una experiencia agradable, desde el momento en que eliges
                            tu plato hasta que llega a tu mesa o a la puerta de tu casa.
                        </p>
                        <a className="nosotros-boton" href="/paginas/menu/carta/">Ver nuestra carta</a>
                    </div>
                    <div className="nosotros-visual">
                        <figure className="nosotros-visual-principal">
                            <img
                                alt="Equipo de La Fonda compartiendo un momento en un ambiente cálido"
                                src="/imagenes/la_fonda_real/equipo-brindis.jpg"
                                loading="eager"
                                decoding="async"
                            />
                            <figcaption>NUESTRO EQUIPO Y AMBIENTE</figcaption>
                        </figure>
                        <figure className="nosotros-visual-detalle">
                            <img
                                alt="Preparación dedicada detrás de cada detalle"
                                src="/imagenes/la_fonda_real/equipo-preparacion.jpg"
                                loading="lazy"
                                decoding="async"
                            />
                            <figcaption>DEDICACIÓN EN CADA PREPARACIÓN</figcaption>
                        </figure>
                    </div>
                </div>
            </section>

            <section className="nosotros-historia">
                <div className="container">
                    <div className="nosotros-seccion-encabezado">
                        <p className="nosotros-kicker">NUESTRA HISTORIA</p>
                        <h2>Una experiencia hecha para <span className="highlight">compartir</span></h2>
                        <p>
                            La Fonda combina recetas conocidas, presentaciones modernas y una atención cercana para
                            crear un espacio donde comer bien sea sencillo y agradable.
                        </p>
                    </div>
                    <div className="historia-grid">
                        {historia.map(({ icono, titulo, descripcion }) => (
                            <article className="historia-card" key={titulo}>
                                <div className="historia-icono"><i className={icono}></i></div>
                                <h3>{titulo}</h3>
                                <p>{descripcion}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="nosotros-identidad">
                <div className="container identidad-grid">
                    {identidad.map(({ numero, etiqueta, titulo, descripcion }) => (
                        <article className="identidad-card" key={numero}>
                            <span className="identidad-numero">{numero}</span>
                            <div>
                                <p className="nosotros-kicker">{etiqueta}</p>
                                <h2>{titulo}</h2>
                                <p>{descripcion}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="nosotros-valores">
                <div className="container">
                    <div className="nosotros-seccion-encabezado">
                        <p className="nosotros-kicker">LO QUE NOS REPRESENTA</p>
                        <h2>Nuestros <span className="highlight">valores</span></h2>
                    </div>
                    <div className="valores-grid">
                        {valores.map(({ numero, titulo, descripcion }) => (
                            <article className="valor" key={numero}>
                                <span>{numero}</span>
                                <h3>{titulo}</h3>
                                <p>{descripcion}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
