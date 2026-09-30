function inicializarNavbar() {
    inicializarMenuMovil();
    marcarPaginaActiva();
    inicializarMenuUsuario();
}

function inicializarMenuMovil() {

    const boton = document.getElementById("nav-btn-toggle");

    const menu = document.getElementById("nav-menu-list");

    if (!boton || !menu) {
        return;
    }

    boton.addEventListener("click", () => {

        boton.classList.toggle("active");

        menu.classList.toggle("open");

    });

    const enlaces =
        menu.querySelectorAll(".nav-link");

    enlaces.forEach((enlace) => {

        enlace.addEventListener("click", () => {

            boton.classList.remove("active");

            menu.classList.remove("open");

        });

    });

}

function marcarPaginaActiva() {

    const rutaActual =
        window.location.pathname;

    const enlaces =
        document.querySelectorAll(".nav-link");

    enlaces.forEach((enlace) => {

        enlace.classList.remove("active");

        const rutaEnlace =
            enlace.getAttribute("href");

        if (!rutaEnlace) {
            return;
        }

        if (
            rutaActual === rutaEnlace ||

            (
                rutaEnlace === "/index.html" &&

                (
                    rutaActual === "/" ||
                    rutaActual.endsWith("/index.html")
                )
            )
        ) {

            enlace.classList.add("active");

        }

    });

}

function inicializarMenuUsuario() {

    const boton =
        document.getElementById("nav-user-btn");

    const menu =
        document.getElementById("user-dropdown");

    if (!boton || !menu) {
        return;
    }

    boton.addEventListener("click", (evento) => {

        evento.stopPropagation();

        menu.classList.toggle("open");

    });

    document.addEventListener("click", (evento) => {

        const clicEnBoton =
            boton.contains(evento.target);

        const clicEnMenu =
            menu.contains(evento.target);

        if (!clicEnBoton && !clicEnMenu) {

            menu.classList.remove("open");

        }

    });

    document.addEventListener("keydown", (evento) => {

        if (evento.key === "Escape") {

            menu.classList.remove("open");

        }

    });

}