(function () {
    const RECHAZOS_KEY = "lafonda_stock_rechazos_v4";
    const RECHAZO_TTL_MS = 60 * 1000;

    const lecturaState = {
        intentada: false,
        stockDiarioLegible: false,
        recetasLegibles: false,
        fecha: null,
        ultimoErrorStock: "",
        ultimoErrorRecetas: ""
    };

    function tienePropiedad(objeto, nombre) {
        return Boolean(objeto) && Object.prototype.hasOwnProperty.call(objeto, nombre);
    }

    function aBooleano(valor) {
        if (typeof valor === "boolean") return valor;
        if (typeof valor === "number") return valor !== 0;
        if (typeof valor === "string") {
            const texto = valor.trim().toLowerCase();
            if (["true", "1", "si", "sí", "yes", "on", "activo", "disponible"].includes(texto)) return true;
            if (["false", "0", "no", "off", "", "inactivo", "agotado"].includes(texto)) return false;
        }
        return Boolean(valor);
    }

    function primerCampo(objeto, nombres) {
        for (const nombre of nombres) {
            if (tienePropiedad(objeto, nombre)) {
                return { existe: true, nombre, valor: objeto[nombre] };
            }
        }
        return { existe: false, nombre: null, valor: undefined };
    }

    function fechaLima() {
        const partes = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Lima",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(new Date());

        const mapa = Object.fromEntries(
            partes
                .filter((parte) => parte.type !== "literal")
                .map((parte) => [parte.type, parte.value])
        );

        return `${mapa.year}-${mapa.month}-${mapa.day}`;
    }

    function leerRechazos() {
        let datos = {};

        try {
            datos = JSON.parse(sessionStorage.getItem(RECHAZOS_KEY) || "{}") || {};
        } catch {
            datos = {};
        }

        const ahora = Date.now();
        const hoy = fechaLima();
        let cambio = false;

        for (const [id, registro] of Object.entries(datos)) {
            const vencido = !registro || registro.fecha !== hoy || Number(registro.hasta || 0) <= ahora;
            if (vencido) {
                delete datos[id];
                cambio = true;
            }
        }

        if (cambio) {
            sessionStorage.setItem(RECHAZOS_KEY, JSON.stringify(datos));
        }

        return datos;
    }

    function estaRechazado(id) {
        if (id === null || id === undefined) return false;
        return Boolean(leerRechazos()[String(Number(id))]);
    }

    function marcarRechazo(id, mensaje) {
        const numero = Number(id);
        if (!Number.isFinite(numero) || numero <= 0) return;

        const datos = leerRechazos();
        datos[String(numero)] = {
            fecha: fechaLima(),
            hasta: Date.now() + RECHAZO_TTL_MS,
            mensaje: String(mensaje || "Stock no disponible")
        };
        sessionStorage.setItem(RECHAZOS_KEY, JSON.stringify(datos));
    }

    function limpiarRechazo(id) {
        const datos = leerRechazos();
        const clave = String(Number(id));
        if (Object.prototype.hasOwnProperty.call(datos, clave)) {
            delete datos[clave];
            sessionStorage.setItem(RECHAZOS_KEY, JSON.stringify(datos));
        }
    }

    function limpiarRechazos() {
        sessionStorage.removeItem(RECHAZOS_KEY);
    }

    async function leerTabla(ruta) {
        const config = window.LAFONDA_CONFIG || {};

        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            throw new Error("Supabase no está configurado");
        }

        const respuesta = await fetch(
            `${config.supabaseUrl}/rest/v1/${ruta}`,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    apikey: config.supabaseAnonKey,
                    Authorization: `Bearer ${config.supabaseAnonKey}`,
                    Accept: "application/json"
                }
            }
        );

        const texto = await respuesta.text();
        let datos = null;

        if (texto) {
            try {
                datos = JSON.parse(texto);
            } catch {
                datos = texto;
            }
        }

        if (!respuesta.ok) {
            const mensaje = datos?.message || datos?.details || datos?.hint || `HTTP ${respuesta.status}`;
            throw new Error(String(mensaje));
        }

        return Array.isArray(datos) ? datos : [];
    }

    function filaMasReciente(actual, candidata) {
        if (!actual) return candidata;

        const fechaActual = Date.parse(actual.updated_at || actual.created_at || 0) || 0;
        const fechaCandidata = Date.parse(candidata.updated_at || candidata.created_at || 0) || 0;

        return fechaCandidata >= fechaActual ? candidata : actual;
    }

    async function cargarLecturaDiaria() {
        const hoy = fechaLima();
        lecturaState.intentada = true;
        lecturaState.fecha = hoy;
        lecturaState.stockDiarioLegible = false;
        lecturaState.recetasLegibles = false;
        lecturaState.ultimoErrorStock = "";
        lecturaState.ultimoErrorRecetas = "";

        const rutaStock =
            `plato_stock_diario?select=plato_id,fecha,stock_actual,activo,updated_at&fecha=eq.${encodeURIComponent(hoy)}`;
        const rutaRecetas =
            "plato_ingredientes?select=plato_id";

        const [stockResultado, recetasResultado] = await Promise.allSettled([
            leerTabla(rutaStock),
            leerTabla(rutaRecetas)
        ]);

        const stockPorPlato = new Map();
        const platosConReceta = new Set();

        if (stockResultado.status === "fulfilled") {
            lecturaState.stockDiarioLegible = true;

            for (const fila of stockResultado.value) {
                const id = Number(fila.plato_id);
                if (!Number.isFinite(id) || id <= 0) continue;
                stockPorPlato.set(id, filaMasReciente(stockPorPlato.get(id), fila));
            }
        } else {
            lecturaState.ultimoErrorStock = String(stockResultado.reason?.message || stockResultado.reason || "");
        }

        if (recetasResultado.status === "fulfilled") {
            lecturaState.recetasLegibles = true;

            for (const fila of recetasResultado.value) {
                const id = Number(fila.plato_id);
                if (Number.isFinite(id) && id > 0) platosConReceta.add(id);
            }
        } else {
            lecturaState.ultimoErrorRecetas = String(recetasResultado.reason?.message || recetasResultado.reason || "");
        }

        return {
            fecha: hoy,
            stockPorPlato,
            platosConReceta,
            stockDiarioLegible: lecturaState.stockDiarioLegible,
            recetasLegibles: lecturaState.recetasLegibles
        };
    }

    async function enriquecerCatalogo(catalogo) {
        if (!catalogo || !Array.isArray(catalogo.platos)) return catalogo;

        let lectura;

        try {
            lectura = await cargarLecturaDiaria();
        } catch (error) {
            lecturaState.intentada = true;
            lecturaState.ultimoErrorStock = String(error?.message || error || "");
            return catalogo;
        }

        for (const plato of catalogo.platos) {
            const id = Number(plato.id);
            const fila = lectura.stockPorPlato.get(id);

            if (fila) {
                plato.stock_hoy = Math.max(0, Number(fila.stock_actual || 0));
                plato.stock_habilitado_hoy = fila.activo !== false;
                plato.stock_fecha = lectura.fecha;
                plato.stock_origen = "plato_stock_diario";
                continue;
            }

            if (
                lectura.stockDiarioLegible &&
                lectura.recetasLegibles &&
                lectura.platosConReceta.has(id)
            ) {
                plato.stock_hoy = 0;
                plato.stock_habilitado_hoy = false;
                plato.stock_fecha = lectura.fecha;
                plato.stock_origen = "plato_stock_diario_sin_fila_hoy";
            }
        }

        return catalogo;
    }

    function camposDiarios(item) {
        const cantidad = primerCampo(item, [
            "stock_hoy",
            "stock_actual_hoy",
            "stock_diario",
            "stock_disponible_hoy",
            "disponible_hoy_cantidad",
            "cantidad_hoy"
        ]);

        const habilitado = primerCampo(item, [
            "stock_habilitado_hoy",
            "stock_activo_hoy",
            "gestiona_stock_hoy",
            "control_stock_hoy",
            "disponible_hoy"
        ]);

        const fecha = primerCampo(item, [
            "stock_fecha",
            "fecha_stock",
            "fecha_stock_hoy"
        ]);

        return { cantidad, habilitado, fecha };
    }

    function info(item) {
        if (!item) {
            return {
                publicado: false,
                confiable: true,
                controlado: true,
                cantidad: 0,
                disponible: false,
                fuente: "sin_producto",
                estado: "NO_DISPONIBLE"
            };
        }

        const publicado = item.disponible !== false && item.activo !== false;

        if (!publicado) {
            return {
                publicado: false,
                confiable: true,
                controlado: false,
                cantidad: 0,
                disponible: false,
                fuente: "publicacion",
                estado: "NO_PUBLICADO"
            };
        }

        const diarios = camposDiarios(item);
        const hayDatoDiario = diarios.cantidad.existe || diarios.habilitado.existe || diarios.fecha.existe;

        if (hayDatoDiario) {
            let habilitado = true;
            if (diarios.habilitado.existe) {
                habilitado = aBooleano(diarios.habilitado.valor);
            }

            let cantidad = null;
            if (diarios.cantidad.existe && diarios.cantidad.valor !== null && diarios.cantidad.valor !== undefined) {
                const numero = Number(diarios.cantidad.valor);
                cantidad = Number.isFinite(numero) ? Math.max(0, numero) : 0;
            }

            const disponible = habilitado && (cantidad === null || cantidad > 0);

            if (disponible && item.id !== null && item.id !== undefined) {
                limpiarRechazo(item.id);
            }

            return {
                publicado: true,
                confiable: true,
                controlado: true,
                cantidad,
                disponible,
                fuente: "stock_diario",
                estado: disponible ? "DISPONIBLE" : "AGOTADO"
            };
        }

        if (estaRechazado(item.id)) {
            return {
                publicado: true,
                confiable: true,
                controlado: true,
                cantidad: 0,
                disponible: false,
                fuente: "servidor",
                estado: "RECHAZADO_SERVIDOR"
            };
        }

        return {
            publicado: true,
            confiable: false,
            controlado: false,
            cantidad: null,
            disponible: true,
            fuente: "no_expuesta",
            estado: "DESCONOCIDO"
        };
    }

    function buscarPlato(catalogo, id) {
        return (catalogo?.platos || []).find(
            (plato) => Number(plato.id) === Number(id)
        ) || null;
    }

    function buscarCombo(catalogo, id) {
        return (catalogo?.combos || []).find(
            (combo) => Number(combo.id) === Number(id)
        ) || null;
    }

    function validarPlato(producto, catalogo) {
        const plato = buscarPlato(catalogo, producto.id);

        if (!plato) {
            return {
                ok: false,
                mensaje: `${producto.nombre || "El producto"} ya no está disponible en la carta.`
            };
        }

        const stock = info(plato);
        const cantidadPedida = Math.max(1, Number(producto.cantidad || producto.qty || 1));

        if (!stock.publicado) {
            return {
                ok: false,
                mensaje: `${plato.nombre || producto.nombre || "El producto"} ya no está disponible.`
            };
        }

        if (stock.confiable && !stock.disponible) {
            return {
                ok: false,
                mensaje: `${plato.nombre || producto.nombre || "El producto"} no tiene stock operativo disponible hoy.`
            };
        }

        if (stock.confiable && stock.cantidad !== null && cantidadPedida > stock.cantidad) {
            return {
                ok: false,
                mensaje: `${plato.nombre || producto.nombre || "El producto"}: solicitaste ${cantidadPedida}, pero hoy quedan ${stock.cantidad}.`
            };
        }

        return { ok: true, plato, stock };
    }

    function validarCombo(producto, catalogo) {
        const combo = buscarCombo(catalogo, producto.id);

        if (!combo || combo.activo === false) {
            return {
                ok: false,
                mensaje: `${producto.nombre || "El combo"} ya no está disponible.`
            };
        }

        const cantidadCombos = Math.max(1, Number(producto.cantidad || producto.qty || 1));
        const componentes = Array.isArray(combo.items) ? combo.items : [];

        for (const componente of componentes) {
            const platoId = componente.plato_id ?? componente.id;
            if (platoId === null || platoId === undefined) continue;

            const plato = buscarPlato(catalogo, platoId);
            if (!plato) continue;

            const stock = info(plato);
            const porCombo = Math.max(1, Number(componente.cantidad || 1));
            const requerido = porCombo * cantidadCombos;

            if (!stock.publicado || (stock.confiable && !stock.disponible)) {
                return {
                    ok: false,
                    mensaje: `${combo.nombre || producto.nombre || "El combo"} no está disponible porque ${plato.nombre || "uno de sus componentes"} no tiene stock operativo hoy.`
                };
            }

            if (stock.confiable && stock.cantidad !== null && requerido > stock.cantidad) {
                return {
                    ok: false,
                    mensaje: `${combo.nombre || producto.nombre || "El combo"}: no hay stock suficiente de ${plato.nombre}.`
                };
            }
        }

        return { ok: true, combo };
    }

    function validarProducto(producto, catalogo) {
        const tipo = String(producto?.tipo || "PLATO").toUpperCase();

        if (tipo === "PLATO" || tipo === "PERSONALIZADO") {
            return validarPlato(producto, catalogo);
        }

        if (tipo === "COMBO") {
            return validarCombo(producto, catalogo);
        }

        return { ok: true };
    }

    function validarProductos(productos, catalogo) {
        const errores = [];

        for (const producto of productos || []) {
            const resultado = validarProducto(producto, catalogo);
            if (!resultado.ok) errores.push(resultado.mensaje);
        }

        return {
            ok: errores.length === 0,
            errores
        };
    }

    function esErrorStockServidor(error) {
        const mensaje = String(error?.message || error || "").toLowerCase();
        return /stock|agotad|sin disponibilidad|no tiene disponibilidad|sin existencias/.test(mensaje);
    }

    function registrarErrorServidor(error, productos = []) {
        const mensaje = String(error?.message || error || "");

        if (!esErrorStockServidor(error)) {
            return { esStock: false, ids: [], mensaje };
        }

        const ids = new Set();
        const patrones = [
            /plato\s+(\d+)/gi,
            /plato[_\s-]?id\s*[:#]?\s*(\d+)/gi,
            /producto\s+(\d+)/gi
        ];

        for (const patron of patrones) {
            let coincidencia;
            while ((coincidencia = patron.exec(mensaje)) !== null) {
                ids.add(Number(coincidencia[1]));
            }
        }

        if (!ids.size && productos.length === 1) {
            const unico = productos[0];
            const tipo = String(unico?.tipo || "PLATO").toUpperCase();
            if (tipo === "PLATO" || tipo === "PERSONALIZADO") {
                ids.add(Number(unico.id));
            }
        }

        ids.forEach((id) => marcarRechazo(id, mensaje));

        return {
            esStock: true,
            ids: Array.from(ids),
            mensaje
        };
    }

    function describirFuente(item) {
        const estado = info(item);
        if (estado.fuente === "stock_diario") return "Stock diario compartido con escritorio";
        if (estado.fuente === "servidor") return "Validación del servidor";
        if (estado.fuente === "publicacion") return "Estado del catálogo";
        return "Validación final del servidor";
    }

    function estadoLectura() {
        return { ...lecturaState };
    }

    window.LaFondaStock = {
        info,
        buscarPlato,
        buscarCombo,
        validarProducto,
        validarProductos,
        enriquecerCatalogo,
        registrarErrorServidor,
        esErrorStockServidor,
        estaRechazado,
        limpiarRechazo,
        limpiarRechazos,
        describirFuente,
        estadoLectura
    };
})();
