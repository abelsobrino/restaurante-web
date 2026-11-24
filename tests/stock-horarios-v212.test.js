import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {horaAMinutos, minutosAHora, fechaLima, fechaMasDias, horarioDeFecha, proximosHorarios, evaluarReserva, siguientesTurnos, resumenProximaApertura} from '../src/services/horarios.js';
const horario = {activo:true, dias:Array.from({length:7}, (_,i)=>({dia_semana:i+1, hora_apertura:'10:00', hora_cierre:'23:00', cerrado:false})),excepciones:[]};
const fake = new Date('2026-11-23T14:00:00Z'); // 09:00 Lima, lunes 23

test('hora local en Lima y fechas posteriores sin depender del huso del usuario',()=>{
 assert.equal(fechaLima(fake),'2026-11-23');
 assert.equal(fechaMasDias('2026-11-30',1),'2026-12-01');
 assert.equal(horaAMinutos('23:00:00'),1380);
 assert.equal(minutosAHora(1290),'21:30');
 assert.equal(horaAMinutos('25:00'),null);
});
test('reserva hasta 21:30 cuando el cierre es 23:00, y sólo cada 30 minutos',()=>{
 const fecha='2026-11-24';
 assert.equal(horarioDeFecha(horario,fecha).ultima,1290);
 assert.equal(evaluarReserva(horario,fecha,'21:30',fake).ok,true);
 assert.equal(evaluarReserva(horario,fecha,'22:00',fake).ok,false);
 assert.equal(evaluarReserva(horario,fecha,'21:15',fake).ok,false);
 assert.equal(evaluarReserva(horario,fecha,'09:30',fake).ok,false);
 const turnos=siguientesTurnos(horario,fecha,fake);
 assert.equal(turnos[0],'10:00');assert.equal(turnos.at(-1),'21:30');
});
test('horario especial cambia cierre y anula el horario semanal',()=>{
 const datos={...horario,excepciones:[{fecha:'2026-11-24',hora_apertura:'09:00',hora_cierre:'21:00',cerrado:false}]};
 assert.equal(horarioDeFecha(datos,'2026-11-24').ultima,1170);
 assert.equal(horarioDeFecha(datos,'2026-11-24').excepcional,true);
 assert.equal(evaluarReserva(datos,'2026-11-24','19:30',fake).ok,true);
 assert.equal(evaluarReserva(datos,'2026-11-24','20:00',fake).ok,false);
});
test('día excepcional cerrado y domingo cerrado no aceptan turnos',()=>{
 const datos={...horario,excepciones:[{fecha:'2026-11-24',cerrado:true,hora_apertura:'10:00',hora_cierre:'23:00'}]};
 assert.equal(siguientesTurnos(datos,'2026-11-24',fake).length,0);
 assert.equal(evaluarReserva(datos,'2026-11-24','10:00',fake).ok,false);
 const otra={...horario,dias:horario.dias.map(d=>({...d,cerrado:d.dia_semana===7}))};
 assert.equal(horarioDeFecha(otra,'2026-11-29').cerrado,true);
});
test('tarjeta presenta ocho fechas sin alterar el horario original y próxima apertura',()=>{
 assert.equal(proximosHorarios(horario,'2026-11-24').length,8);
 assert.equal(proximosHorarios(horario,'2026-11-24')[7].fecha,'2026-12-01');
 assert.match(resumenProximaApertura(horario,fake),/10:00.*23:00/);
 assert.equal(horario.dias[0].hora_cierre,'23:00');
});
test('reserva pasada y horarios desconocidos no permiten confirmar',()=>{
 assert.equal(evaluarReserva(horario,'2026-11-23','08:30',fake).ok,false);
 assert.equal(evaluarReserva(null,'2026-11-24','19:00',fake).ok,false);
 assert.equal(evaluarReserva({...horario,activo:false},'2026-11-24','19:00',fake).ok,false);
});
test('consulta RPC sólo disponibilidad pública, deshabilita + si stock es cero',async()=>{
 const src=readFileSync(new URL('../src/services/stock.js',import.meta.url),'utf8');
 const calls=[];const window={LaFondaDB:{rpc:async (fn)=>{calls.push(fn);return [{id:10,stock_hoy:0,disponible_hoy:false},{id:11,stock_hoy:4,disponible_hoy:true}];}}};
 const store=new Map(); const sessionStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)};
 runInNewContext(src,{window,sessionStorage,Intl,Date,Map,Set,Object,Number,String,Boolean,JSON});
 const catalogo={platos:[{id:10,nombre:'agotado',disponible:true},{id:11,nombre:'disponible',disponible:true}]};
 const lectura=window.LaFondaStock.prepararLecturaCatalogo();
 await window.LaFondaStock.enriquecerCatalogo(catalogo,lectura);
 assert.deepEqual(calls,['lf_web_disponibilidad_v1']);
 assert.equal(window.LaFondaStock.info(catalogo.platos[0]).disponible,false);
 assert.equal(window.LaFondaStock.info(catalogo.platos[1]).disponible,true);
 assert.equal(window.LaFondaStock.validarProducto({id:10,cantidad:1},catalogo).ok,false);
 assert.equal(window.LaFondaStock.validarProducto({id:11,cantidad:2},catalogo).ok,true);
 assert.equal(window.LaFondaStock.validarProducto({id:11,cantidad:5},catalogo).ok,false);
});
test('front no lee tablas privadas ni comparte credenciales; backend replica reglas',()=>{
 const root = f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
 const sql=root('sql/01_v2.0.12_stock_horarios.sql');
 assert.match(sql,/SECURITY DEFINER/i);
 assert.match(sql,/lf_reserva_horario_valido_v1/);
 assert.match(sql,/lf_reserva_cliente\(p_email,p_password\)/);
 assert.match(sql,/web_login\(p_email/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.lf_web_disponibilidad_v1/);
 assert.doesNotMatch(sql,/GRANT\s+SELECT\s+ON\s+public\.(?:plato_stock_diario|plato_ingredientes)/i);
 const page=root('src/pages/ReservasNuevaReserva.jsx');
 assert.match(page,/reserva-ver-horarios/); assert.match(page,/id=\\"res-hora/);
 const config=root('src/pages/AdministradorConfiguracion.jsx');
 assert.match(config,/lf-excepcion-fecha/);
 const carta=root('src/controllers/paginas__menu__carta__carta.js');
 assert.match(carta,/grupos\.sort\(/);assert.match(carta,/consultandoStock/);
 assert.match(carta,/stock-badge/);
});
