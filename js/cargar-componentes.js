document.addEventListener("DOMContentLoaded", async () => {

    await Promise.all([
        cargarComponente(
            "/componentes/navbar/index.html",
            "global-nav"
        ),

        cargarComponente(
            "/componentes/footer/index.html",
            "global-footer"
        )
    ]);

    if (typeof inicializarNavbar === "function") {
        inicializarNavbar();
    }

    if (typeof window.actualizarNavbarSesion === "function") {
        window.actualizarNavbarSesion();
    }

    if (typeof inicializarTransiciones === "function") {
        inicializarTransiciones();
    }

});

async function cargarComponente(ruta, idContenedor) {

    const contenedor =
        document.getElementById(idContenedor);

    if (!contenedor) {
        return;
    }

    try {

        const respuesta =
            await fetch(ruta);

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP: ${respuesta.status}`
            );

        }

        const html =
            await respuesta.text();

        contenedor.innerHTML = html;

    }

    catch (error) {

        console.error(
            `Error cargando ${ruta}:`,
            error
        );

    }

}