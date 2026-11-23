// La posición del carrito flotante respeta los límites del encabezado y
// la navegación inferior. Funciona sin modificar el flujo de pedidos.
export function calcularLimitesCarrito({ anchoPantalla, altoPantalla, anchoBoton, altoBoton, limiteSuperior, inicioBarraInferior }) {
    // Margen amplio para que ni el contador ni la sombra se recorten en iOS.
    const margenLateral = 24;
    const minX = margenLateral;
    const maxX = Math.max(minX, anchoPantalla - anchoBoton - margenLateral);
    const minY = Math.max(24, limiteSuperior + 20);
    const maxY = Math.max(minY, Math.min(altoPantalla, inicioBarraInferior) - altoBoton - 22);
    return { minX, maxX, minY, maxY };
}

const ajustar = (valor, menor, mayor) => Math.max(menor, Math.min(mayor, valor));
// Se renueva la clave para no reutilizar posiciones pegadas al borde
// de versiones anteriores. Desde esta versión sí se conserva el arrastre.
const CLAVE = 'lafonda-carrito-flotante-pos-v2';

export function configurarCarritoFlotante(boton, scope) {
    if (!boton) return;
    const win = scope.window;
    // A diferencia de scope.document, este documento incluye el Navbar de React.
    const doc = globalThis.document || scope.document;
    let posicion = null;
    let movimiento = null;
    let ignorarClick = false;

    function limites() {
        // innerWidth / innerHeight son más estables en posición fixed;
        // el visualViewport facilita ajustar cuando cambia la barra de Safari.
        const alto = Number(win.visualViewport?.height) || Number(win.innerHeight) || doc.documentElement?.clientHeight || 700;
        const ancho = Number(win.visualViewport?.width) || Number(win.innerWidth) || doc.documentElement?.clientWidth || 375;
        const cabecera = doc.querySelector?.('.main-header');
        const selector = doc.querySelector?.('.lf-mobile-group-switch');
        const barra = doc.querySelector?.('.lf-mobile-tabs');
        const finCabecera = cabecera?.getBoundingClientRect?.().bottom || 68;
        const finSelector = selector?.getBoundingClientRect?.().bottom || 0;
        const inicioBarra = barra?.getBoundingClientRect?.().top ?? alto - 82;
        const anchoBoton = boton.offsetWidth || 58;
        const altoBoton = boton.offsetHeight || 58;
        return calcularLimitesCarrito({
            anchoPantalla: ancho, altoPantalla: alto,
            anchoBoton, altoBoton,
            limiteSuperior: Math.max(finCabecera, finSelector),
            inicioBarraInferior: inicioBarra
        });
    }

    function dibujar(x, y) {
        const { minX, maxX, minY, maxY } = limites();
        posicion = { x: ajustar(x, minX, maxX), y: ajustar(y, minY, maxY) };
        Object.assign(boton.style, {
            left: `${posicion.x}px`, top: `${posicion.y}px`,
            right: 'auto', bottom: 'auto'
        });
        // No mostrar un botón en su posición CSS provisional antes de medirlo.
        boton.setAttribute?.('data-cart-ready', 'true');
    }

    function guardar() {
        try {
            const { minX, maxX, minY, maxY } = limites();
            const px = maxX > minX ? (posicion.x - minX) / (maxX - minX) : 1;
            const py = maxY > minY ? (posicion.y - minY) / (maxY - minY) : 1;
            win.localStorage?.setItem(CLAVE, JSON.stringify({ x: px, y: py }));
        } catch { /* Es opcional recordar la posición. */ }
    }

    function restaurar() {
        const { minX, maxX, minY, maxY } = limites();
        try {
            const previo = JSON.parse(win.localStorage?.getItem(CLAVE) || 'null');
            if (Number.isFinite(previo?.x) && Number.isFinite(previo?.y)) {
                dibujar(minX + ajustar(previo.x, 0, 1) * (maxX - minX),
                    minY + ajustar(previo.y, 0, 1) * (maxY - minY));
                return;
            }
        } catch { /* Se usa la ubicación por defecto. */ }
        // Ubicación inicial cómoda, no pegada al borde ni encima de la barra.
        dibujar(Math.max(minX, maxX - 12), Math.max(minY, maxY - 16));
    }

    function alPresionar(e) {
        if (e.button !== undefined && e.button !== 0) return;
        if (!posicion) restaurar();
        movimiento = { id: e.pointerId, x: e.clientX, y: e.clientY,
            inicialX: posicion.x, inicialY: posicion.y, arrastrado: false };
        boton.setPointerCapture?.(e.pointerId);
    }

    function alMover(e) {
        if (!movimiento || e.pointerId !== movimiento.id) return;
        const dx = e.clientX - movimiento.x;
        const dy = e.clientY - movimiento.y;
        if (!movimiento.arrastrado && Math.hypot(dx, dy) < 7) return;
        movimiento.arrastrado = true;
        dibujar(movimiento.inicialX + dx, movimiento.inicialY + dy);
    }

    function alSoltar(e) {
        if (!movimiento || e.pointerId !== movimiento.id) return;
        if (movimiento.arrastrado) {
            ignorarClick = true;
            guardar();
        }
        movimiento = null;
        if (boton.hasPointerCapture?.(e.pointerId)) boton.releasePointerCapture?.(e.pointerId);
    }

    function alClick(e) {
        if (ignorarClick) {
            ignorarClick = false;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        // Conserva la navegación SPA gestionada por el scope de la página.
        win.location.href = '/paginas/pedidos/carrito/';
    }

    function alTeclado(e) {
        const delta = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }[e.key];
        if (!delta) return;
        e.preventDefault();
        dibujar((posicion?.x || 0) + delta[0], (posicion?.y || 0) + delta[1]);
        guardar();
    }

    function alCambiarPantalla() {
        if (movimiento) return;
        restaurar();
    }

    boton.title = 'Toca para ver el carrito; mantén pulsado y arrastra para moverlo';
    boton.addEventListener('pointerdown', alPresionar);
    boton.addEventListener('pointermove', alMover);
    boton.addEventListener('pointerup', alSoltar);
    boton.addEventListener('pointercancel', alSoltar);
    boton.addEventListener('click', alClick);
    boton.addEventListener('keydown', alTeclado);
    win.addEventListener('resize', alCambiarPantalla);
    win.addEventListener('orientationchange', alCambiarPantalla);
    win.visualViewport?.addEventListener?.('resize', alCambiarPantalla);
    restaurar();

    scope.onDispose?.(() => {
        boton.removeEventListener('pointerdown', alPresionar);
        boton.removeEventListener('pointermove', alMover);
        boton.removeEventListener('pointerup', alSoltar);
        boton.removeEventListener('pointercancel', alSoltar);
        boton.removeEventListener('click', alClick);
        boton.removeEventListener('keydown', alTeclado);
        win.visualViewport?.removeEventListener?.('resize', alCambiarPantalla);
    });
}
