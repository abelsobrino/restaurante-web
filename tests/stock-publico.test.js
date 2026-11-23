import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const codigo = readFileSync(new URL('../src/services/stock.js', import.meta.url), 'utf8');
function iniciarStock() {
  let llamadas = 0;
  const almacen = new Map();
  const window = {};
  const sessionStorage = {
    getItem: k => almacen.get(k) ?? null,
    setItem: (k, v) => almacen.set(k, v),
    removeItem: k => almacen.delete(k)
  };
  runInNewContext(codigo, {
    window, sessionStorage, Intl, Date, Map, Set, Object, Number, String, Boolean, JSON,
    fetch: () => { llamadas++; throw new Error('No debe consultar tablas privadas'); }
  });
  return { stock: window.LaFondaStock, getLlamadas: () => llamadas };
}

test('Carta y carrito no leen tablas privadas con el rol anon', async () => {
  const { stock, getLlamadas } = iniciarStock();
  const catalogo = { platos: [{ id: 1, disponible: true, stock_hoy: 3 }, { id: 2, disponible: true }] };
  const preparacion = stock.prepararLecturaCatalogo();
  assert.equal(await stock.enriquecerCatalogo(catalogo, preparacion), catalogo);
  assert.equal(getLlamadas(), 0);
  assert.equal(stock.info(catalogo.platos[0]).cantidad, 3);
  assert.equal(stock.info(catalogo.platos[1]).confiable, false);
});

test('Stock cero de web_catalogo impide venta en validacion local', async () => {
  const { stock } = iniciarStock();
  const catalogo = { platos: [{ id: 10, nombre: 'Plato', disponible: true, stock_hoy: 0 }] };
  const resultado = stock.validarProducto({ tipo: 'PLATO', id: 10, cantidad: 1 }, catalogo);
  assert.equal(resultado.ok, false);
});

test('Stock no expuesto no se inventa ni bloquea el catalogo; servidor valida al cobrar', async () => {
  const { stock } = iniciarStock();
  const catalogo = { platos: [{ id: 11, nombre: 'Plato', disponible: true }] };
  const resultado = stock.validarProducto({ tipo: 'PLATO', id: 11, cantidad: 1 }, catalogo);
  assert.equal(resultado.ok, true);
  assert.equal(resultado.stock.confiable, false);
});

test('No hay referencias de lectura REST a inventario privado', () => {
  assert.doesNotMatch(codigo, /rest\/v1\/(?:plato_stock_diario|plato_ingredientes)/);
  assert.doesNotMatch(codigo, /fetch\s*\(/);
});
