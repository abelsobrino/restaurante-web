

let transicionesInicializadas = false;

function inicializarTransiciones() {

    if (transicionesInicializadas) {
        return;
    }

    transicionesInicializadas = true;

    document.addEventListener(
        "click",
        manejarTransicion
    );

}

function manejarTransicion(evento) {

    const enlace =
        evento.target.closest(
            "a[href]"
        );

    if (!enlace) {
        return;
    }

    if (evento.defaultPrevented) {
        return;
    }

    if (
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
    ) {

        return;

    }

    const href =
        enlace.getAttribute("href");

    if (!href) {
        return;
    }

    if (href.startsWith("#")) {
        return;
    }

    if (enlace.target === "_blank") {
        return;
    }

    if (
        enlace.hasAttribute("download")
    ) {

        return;

    }

    const destino =
        new URL(
            enlace.href,
            window.location.href
        );

    if (
        destino.origin !==
        window.location.origin
    ) {

        return;

    }

    if (
        CSS.supports?.(
            "view-transition-name: none"
        )
    ) {

        return;

    }

    evento.preventDefault();

    document.body.classList.add(
        "page-leaving"
    );

    setTimeout(() => {

        window.location.href =
            destino.href;

    }, 130);

}