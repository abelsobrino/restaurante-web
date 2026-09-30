

function obtenerSesionPerfil() {

    if (
        !window.LaFondaAuth ||
        typeof LaFondaAuth.getSession !==
            "function"
    ) {

        return null;

    }

    return LaFondaAuth.getSession();

}

function obtenerInicialPerfil(
    sesion
) {

    const nombre =
        String(
            sesion?.nombre || ""
        ).trim();

    const apellido =
        String(
            sesion?.apellido || ""
        ).trim();

    const inicialNombre =
        nombre.charAt(0);

    const inicialApellido =
        apellido.charAt(0);

    return (
        `${inicialNombre}${inicialApellido}`
            .toUpperCase() ||
        "U"
    );

}

function obtenerNombreCompletoPerfil(
    sesion
) {

    return [

        sesion.nombre || "",
        sesion.apellido || ""

    ]
        .join(" ")
        .trim() ||
        "Usuario";

}

function obtenerTextoRol(
    rol
) {

    return (
        String(rol)
            .toUpperCase() ===
        "ADMIN"
    )
        ? "Administrador"
        : "Cliente";

}

function obtenerTextoModo(
    modo
) {

    return (
        String(modo)
            .toUpperCase() ===
        "ADMIN"
    )
        ? "Vista Administrador"
        : "Vista Cliente";

}

function renderizarPerfil() {

    const sesion =
        obtenerSesionPerfil();

    if (!sesion) {

        sessionStorage.setItem(
            "lafonda_return_to",
            window.location.pathname
        );

        window.location.href =
            "/paginas/acceso/iniciar-sesion/";

        return;

    }

    const nombreCompleto =
        obtenerNombreCompletoPerfil(
            sesion
        );

    const rol =
        obtenerTextoRol(
            sesion.rol
        );

    document.getElementById(
        "perfil-avatar"
    ).textContent =
        obtenerInicialPerfil(
            sesion
        );

    document.getElementById(
        "perfil-nombre"
    ).textContent =
        nombreCompleto;

    document.getElementById(
        "perfil-email"
    ).textContent =
        sesion.email ||
        "Correo no registrado";

    document.getElementById(
        "perfil-rol"
    ).textContent =
        rol;

    document.getElementById(
        "dato-nombre"
    ).textContent =
        sesion.nombre ||
        "No registrado";

    document.getElementById(
        "dato-apellido"
    ).textContent =
        sesion.apellido ||
        "No registrado";

    document.getElementById(
        "dato-email"
    ).textContent =
        sesion.email ||
        "No registrado";

    document.getElementById(
        "dato-telefono"
    ).textContent =
        sesion.telefono ||
        "No registrado";

    document.getElementById(
        "dato-rol"
    ).textContent =
        rol;

    if (
        sesion.rol === "ADMIN"
    ) {

        configurarPerfilAdministrador(
            sesion
        );

    }

    else {

        configurarPerfilCliente();

    }

}

function configurarPerfilCliente() {

    document.getElementById(
        "perfil-modo-contenedor"
    ).hidden =
        true;

    document.getElementById(
        "perfil-acceso-admin"
    ).hidden =
        true;

    document.getElementById(
        "perfil-acceso-modo"
    ).hidden =
        true;

    document.getElementById(
        "perfil-acceso-pedidos"
    ).hidden =
        false;

    document.getElementById(
        "perfil-acceso-reservas"
    ).hidden =
        false;

    document.getElementById(
        "perfil-acceso-nueva-reserva"
    ).hidden =
        false;

}

function configurarPerfilAdministrador(
    sesion
) {

    const modoContenedor =
        document.getElementById(
            "perfil-modo-contenedor"
        );

    modoContenedor.hidden =
        false;

    document.getElementById(
        "perfil-modo"
    ).textContent =
        obtenerTextoModo(
            sesion.modo
        );

    document.getElementById(
        "perfil-acceso-admin"
    ).hidden =
        false;

    document.getElementById(
        "perfil-acceso-modo"
    ).hidden =
        false;

    const modoAdmin =
        sesion.modo === "ADMIN";

    document.getElementById(
        "perfil-acceso-pedidos"
    ).hidden =
        modoAdmin;

    document.getElementById(
        "perfil-acceso-reservas"
    ).hidden =
        modoAdmin;

    document.getElementById(
        "perfil-acceso-nueva-reserva"
    ).hidden =
        modoAdmin;

}

function cerrarSesionPerfil() {

    if (
        !window.LaFondaAuth
    ) {

        return;

    }

    const confirmar =
        window.confirm(
            "¿Deseas cerrar tu sesión?"
        );

    if (!confirmar) {

        return;

    }

    LaFondaAuth.logout();

}

function configurarEventosPerfil() {

    document.getElementById(
        "perfil-cerrar-sesion"
    ).addEventListener(
        "click",
        cerrarSesionPerfil
    );

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarEventosPerfil();

        renderizarPerfil();

    }
);