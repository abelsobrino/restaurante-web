import React from "react";
export default function Inicio() { return <>
<main>
<section className={"inicio"}>
<div className={"container inicio-contenido"}>
<div className={"inicio-texto"}>
<h1 className={"inicio-titulo"}>{"\n                        Disfruta de Comida\n                        "}<span className={"highlight"}>{"Fresca"}</span>
<br />{"\n                        A Tu Propia Manera\n                    "}</h1>
<p className={"inicio-descripcion"}>{"\n                        En La Fonda, creemos que la frescura no es negociable.\n                        Cada ingrediente es seleccionado cuidadosamente de\n                        productores locales para garantizar explosiones de sabor\n                        en cada bocado. Desde nuestras hamburguesas gourmet\n                        montadas al momento hasta nuestras ensaladas vibrantes,\n                        preparamos todo con pasión y rapidez, adaptándonos a tu\n                        ritmo de vida sin sacrificar la calidad artesanal.\n                    "}</p>
<a className={"inicio-boton"} href={"/paginas/menu/carta/"}>{"\n                        Ordenar ahora\n                    "}</a>
</div>
<div className={"inicio-imagen"}>
<img alt={"Hamburguesa de La Fonda"} className={"inicio-hamburguesa"} src={"/imagenes/platos/hamburguesa.webp"} />
</div>
</div>
</section>
</main>
</>; }
