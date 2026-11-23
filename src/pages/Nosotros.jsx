import React from "react";
export default function Nosotros() { return <>
<main className={"nosotros"}>
<section className={"nosotros-presentacion"}>
<div className={"container nosotros-presentacion-grid"}>
<div className={"nosotros-presentacion-texto"}>
<p className={"nosotros-kicker"}>{"\n                        CONOCE LA FONDA\n                    "}</p>
<h1 className={"nosotros-titulo"}>{"\n                        Sobre\n                        "}<span className={"highlight"}>{"\n                            Nosotros\n                        "}</span>
</h1>
<h2 className={"nosotros-subtitulo"}>{"\n                        Sabor, tradición y buenos momentos.\n                    "}</h2>
<p className={"nosotros-descripcion"}>{"\n                        La Fonda nació con una idea sencilla:\n                        ofrecer comida preparada con dedicación,\n                        ingredientes seleccionados y ese sabor\n                        especial que hace que quieras volver.\n                    "}</p>
<p className={"nosotros-descripcion"}>{"\n                        Buscamos que cada visita sea una experiencia\n                        agradable, desde el momento en que eliges tu\n                        plato hasta que llega a tu mesa o a la puerta\n                        de tu casa.\n                    "}</p>
<a className={"nosotros-boton"} href={"/paginas/menu/carta/"}>{"\n                        Ver nuestra carta\n                    "}</a>
</div>
<div className={"nosotros-visual"}>
<figure className={"nosotros-visual-principal"}>
<img alt={"Equipo de La Fonda compartiendo un momento en un ambiente cálido"} src={"/imagenes/la_fonda_real/equipo-brindis.jpg"} loading={"eager"} decoding={"async"}/>
<figcaption>NUESTRO EQUIPO Y AMBIENTE</figcaption>
</figure>
<figure className={"nosotros-visual-detalle"}>
<img alt={"Preparación dedicada detrás de cada detalle"} src={"/imagenes/la_fonda_real/equipo-preparacion.jpg"} loading={"lazy"} decoding={"async"}/>
<figcaption>DEDICACIÓN EN CADA PREPARACIÓN</figcaption>
</figure>
</div>
</div>
</section>
<section className={"nosotros-historia"}>
<div className={"container"}>
<div className={"nosotros-seccion-encabezado"}>
<p className={"nosotros-kicker"}>{"\n                        NUESTRA HISTORIA\n                    "}</p>
<h2>{"\n                        Una experiencia hecha para\n                        "}<span className={"highlight"}>{"\n                            compartir\n                        "}</span>
</h2>
<p>{"\n                        La Fonda combina recetas conocidas,\n                        presentaciones modernas y una atención\n                        cercana para crear un espacio donde comer\n                        bien sea sencillo y agradable.\n                    "}</p>
</div>
<div className={"historia-grid"}>
<article className={"historia-card"}>
<div className={"historia-icono"}>
<i className={"fa-solid fa-utensils"}></i>
</div>
<h3>{"\n                            Buena comida\n                        "}</h3>
<p>{"\n                            Preparamos cada pedido buscando mantener\n                            un equilibrio entre sabor, presentación\n                            y calidad.\n                        "}</p>
</article>
<article className={"historia-card"}>
<div className={"historia-icono"}>
<i className={"fa-solid fa-seedling"}></i>
</div>
<h3>{"\n                            Ingredientes seleccionados\n                        "}</h3>
<p>{"\n                            Elegimos cuidadosamente nuestros\n                            ingredientes para ofrecer platos frescos\n                            y consistentes.\n                        "}</p>
</article>
<article className={"historia-card"}>
<div className={"historia-icono"}>
<i className={"fa-solid fa-heart"}></i>
</div>
<h3>{"\n                            Atención cercana\n                        "}</h3>
<p>{"\n                            Queremos que nuestros clientes se sientan\n                            cómodos y disfruten cada experiencia con\n                            nosotros.\n                        "}</p>
</article>
</div>
</div>
</section>
<section className={"nosotros-identidad"}>
<div className={"container identidad-grid"}>
<article className={"identidad-card"}>
<span className={"identidad-numero"}>{"\n                        01\n                    "}</span>
<div>
<p className={"nosotros-kicker"}>{"\n                            NUESTRA MISIÓN\n                        "}</p>
<h2>{"\n                            Crear buenos momentos alrededor de la comida\n                        "}</h2>
<p>{"\n                            Brindar una experiencia gastronómica\n                            agradable mediante platos preparados con\n                            dedicación, atención eficiente y un servicio\n                            pensado para nuestros clientes.\n                        "}</p>
</div>
</article>
<article className={"identidad-card"}>
<span className={"identidad-numero"}>{"\n                        02\n                    "}</span>
<div>
<p className={"nosotros-kicker"}>{"\n                            NUESTRA VISIÓN\n                        "}</p>
<h2>{"\n                            Seguir creciendo junto a nuestros clientes\n                        "}</h2>
<p>{"\n                            Convertir a La Fonda en una alternativa\n                            reconocida por su sabor, atención y capacidad\n                            de adaptarse a nuevas formas de disfrutar\n                            nuestros platos.\n                        "}</p>
</div>
</article>
</div>
</section>
<section className={"nosotros-valores"}>
<div className={"container"}>
<div className={"nosotros-seccion-encabezado"}>
<p className={"nosotros-kicker"}>{"\n                        LO QUE NOS REPRESENTA\n                    "}</p>
<h2>{"\n                        Nuestros\n                        "}<span className={"highlight"}>{"\n                            valores\n                        "}</span>
</h2>
</div>
<div className={"valores-grid"}>
<article className={"valor"}>
<span>{"\n                            01\n                        "}</span>
<h3>{"\n                            Calidad\n                        "}</h3>
<p>{"\n                            Cuidamos nuestros ingredientes,\n                            preparación y presentación.\n                        "}</p>
</article>
<article className={"valor"}>
<span>{"\n                            02\n                        "}</span>
<h3>{"\n                            Responsabilidad\n                        "}</h3>
<p>{"\n                            Trabajamos para cumplir cada pedido\n                            correctamente y a tiempo.\n                        "}</p>
</article>
<article className={"valor"}>
<span>{"\n                            03\n                        "}</span>
<h3>{"\n                            Cercanía\n                        "}</h3>
<p>{"\n                            Escuchamos a nuestros clientes y buscamos\n                            brindar una atención amable.\n                        "}</p>
</article>
<article className={"valor"}>
<span>{"\n                            04\n                        "}</span>
<h3>{"\n                            Innovación\n                        "}</h3>
<p>{"\n                            Incorporamos nuevas herramientas y opciones\n                            para mejorar la experiencia del restaurante.\n                        "}</p>
</article>
</div>
</div>
</section>
</main>
</>; }
