import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {prepararNotificacion} from '../src/services/mensajes.js';

const leer = (ruta) => readFileSync(new URL('../' + ruta, import.meta.url), 'utf8');
function extraerFuncion(ruta, nombre, siguiente) {
    const texto = leer(ruta);
    const inicio = texto.indexOf('function ' + nombre + '(');
    assert.ok(inicio >= 0, `No se encontró ${nombre}`);
    const cierre = siguiente ? texto.indexOf('function ' + siguiente + '(', inicio + 1) : -1;
    const fragmento = cierre >= 0 ? texto.slice(inicio, cierre) : texto.slice(inicio);
    return runInNewContext(`${fragmento}\n${nombre};`);
}

test('validación de correos conserva entradas normales y rechaza datos incompletos sin retroceso', () => {
    const correos = [
        ['src/controllers/paginas__acceso__iniciar-sesion__iniciar-sesion.js','emailLoginValido','configurarMostrarPassword'],
        ['src/controllers/paginas__contacto__contacto.js','contactoEmailValido','mostrarEstadoContacto'],
        ['src/controllers/paginas__reservas__nueva-reserva__nueva-reserva.js','emailReservaValido','telefonoReservaValido']
    ];
    for (const [ruta, nombre, siguiente] of correos) {
        const valida = extraerFuncion(ruta, nombre, siguiente);
        assert.equal(valida('cliente@ejemplo.com'), true, ruta);
        assert.equal(valida('cliente+promo@dominio.com.pe'), true, ruta);
        for (const invalido of ['sin-arroba','@ejemplo.com','cliente@.com','cliente@ejemplo.','a@@ejemplo.com','a@ejemplo.com ','a@ejemplo .com']) {
            assert.equal(valida(invalido), false, `${ruta}: ${invalido}`);
        }
        assert.equal(valida('a@b' + ' '.repeat(40000) + 'x'), false);
    }
});

test('extracción de porciones no depende de regex con retroceso y conserva los formatos válidos', () => {
    const porcion = extraerFuncion('src/controllers/paginas__menu__carta__carta.js','extraerPorcion','agruparPlatos');
    const misma = (valor, base, n) => {
        const resultado = porcion(valor);
        assert.equal(resultado?.base, base);
        assert.equal(resultado?.porcion, n);
    };
    misma('Hamburguesa x 2', 'Hamburguesa', 2);
    misma('Sushi — x 3', 'Sushi', 3);
    misma('Broaster × 10', 'Broaster', 10);
    misma('Combo X 1', 'Combo', 1);
    assert.equal(porcion('Combo especial'), null);
    assert.equal(porcion('Combo x 0'), null);
    assert.equal(porcion('x 3'), null);
    assert.equal(porcion('Plato' + ' '.repeat(40000) + 'Y'), null);
});

test('notificación individual valida correos sin expresión regular ambigua', () => {
    const datos = {tipo:'PROMOCION', categoria:'', titulo:'Promoción',mensaje:'Mensaje de prueba', audiencia:'INDIVIDUAL', destinatario:'cliente@ejemplo.com'};
    assert.equal(prepararNotificacion(datos).p_destinatario, 'cliente@ejemplo.com');
    for (const destino of ['cliente@@ejemplo.com','a@dominio.','@dominio.com','a@dominio .com']) {
        assert.throws(() => prepararNotificacion({...datos,destinatario:destino}), undefined, destino);
    }
});

test('botones administrativos declaran tipo explícito', () => {
    const pagina = leer('src/pages/AdministradorContacto.jsx');
    const botones = pagina.match(/<button\b[^>]*>/g) ?? [];
    assert.ok(botones.length >= 4);
    for (const boton of botones) assert.match(boton, /type="(?:button|submit)"/);
});
