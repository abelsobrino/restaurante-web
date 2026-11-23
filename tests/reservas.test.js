import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setup as nueva} from '../src/controllers/paginas__reservas__nueva-reserva__nueva-reserva.js';
import {setup as mis} from '../src/controllers/paginas__reservas__mis-reservas__mis-reservas.js';
const cliente={email:'prueba@example.invalid',nombre:'Cliente Prueba',telefono:'999000111',rol:'CLIENTE'};
const cred={email:cliente.email,password:'solo-prueba'};
function entorno(rpc){
 const el=new Map(), ready=[], timers=[], listeners={};
 const element=id=>{if(!el.has(id)){el.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,dataset:{},style:{},className:'',classList:{add(){},remove(){}},setAttribute(){},reset(){},listeners:{},addEventListener(k,f){this.listeners[k]=f;}})} return el.get(id);};
 const window={LaFondaAuth:{getSession:()=>cliente,credentials:r=>{assert.equal(r,'CLIENTE');return cred;}},LaFondaDB:{rpc},location:{pathname:'/reservas/'},addEventListener(k,f){listeners[k]=f;}};
 const document={getElementById:element,querySelector:element,querySelectorAll:()=>[],body:{style:{}},addEventListener(k,f){if(k==='DOMContentLoaded')ready.push(f);}};
 const scope={window,document,active:true,setTimeout:f=>timers.push(f),setInterval(){},clearTimeout(){},clearInterval(){}};
 return {scope,element,ready,timers,listeners};
}
function formulario(e){
 nueva(e.scope);e.ready.forEach(f=>f());
 for(const [k,v] of Object.entries({nombre:'Cliente Prueba',email:cliente.email,telefono:'999000111',fecha:'2099-11-17',hora:'19:00',sillas:'4',descripcion:'Prueba'}))e.element('res-'+k).value=v;
 return ()=>e.element('reserva-form').listeners.submit({preventDefault(){}});
}
test('la nueva reserva usa RPC y confirma solamente un ID válido; no se reenvía',async()=>{
 let llamadas=0;const e=entorno(async (fn,p)=>{llamadas++;assert.equal(fn,'lf_crear_reserva');assert.deepEqual(p,{p_email:cred.email,p_password:cred.password,p_nombre:'Cliente Prueba',p_telefono:'999000111',p_fecha:'2099-11-17',p_hora:'19:00',p_personas:4,p_descripcion:'Prueba'});return 123;});
 const enviar=formulario(e);await enviar();await enviar();assert.equal(llamadas,1);assert.match(e.element('reserva-estado').textContent,/Solicitud enviada/);e.timers[0]();assert.match(e.scope.window.location.href,/mis-reservas/);
});
test('si falla Supabase no se informa éxito ni se borra el formulario',async()=>{
 const e=entorno(async()=>{throw new Error('schema cache lf_crear_reserva');});const enviar=formulario(e);await enviar();assert.match(e.element('reserva-estado').textContent,/no está habilitado/);assert.equal(e.element('res-fecha').value,'2099-11-17');assert.equal(e.timers.length,0);assert.equal(e.element('#reserva-form button[type="submit"]').disabled,false);
});
test('una respuesta sin identificador no genera una confirmación',async()=>{
 const e=entorno(async()=>null);await formulario(e)();assert.doesNotMatch(e.element('reserva-estado').textContent,/Solicitud enviada/);assert.equal(e.timers.length,0);
});
test('mis reservas consulta Supabase y muestra estado y mesa del servidor',async()=>{
 const e=entorno(async(fn,p)=>{assert.equal(fn,'lf_mis_reservas');assert.deepEqual(p,{p_email:cred.email,p_password:cred.password});return [{id:'1',nombre:'Cliente Prueba',telefono:'999000111',fecha:'2099-11-17',hora:'19:00',sillas:4,descripcion:'Prueba',estado:'ASIGNADA',mesa_numero:7}];});
 mis(e.scope);e.ready.forEach(f=>f());await new Promise(r=>setImmediate(r));assert.match(e.element('reservas-proximas').innerHTML,/Confirmada/);assert.match(e.element('reservas-proximas').innerHTML,/Mesa asignada/);assert.match(e.element('reservas-proximas').innerHTML,/Cliente Prueba/);assert.equal(e.element('reservas-total-contador').textContent,1);
});
test('un error de consulta no se presenta como una agenda vacía',async()=>{
 const e=entorno(async()=>{throw new Error('offline');});mis(e.scope);e.ready.forEach(f=>f());await new Promise(r=>setImmediate(r));assert.match(e.element('reservas-estado').textContent,/No se pudieron consultar/);assert.equal(e.element('reservas-resumen').hidden,true);
});
test('contrato SQL compartido: RPC y campos, sin persistencia local de reservas',()=>{
 const sql=readFileSync(new URL('../tests/fixtures/sql/01_reservas.sql',import.meta.url),'utf8');
 for(const fn of ['lf_crear_reserva','lf_mis_reservas','lf_cancelar_reserva'])assert.match(sql,new RegExp(`create or replace function public\\.${fn}\\(`));
 for(const col of ['cliente_id','nombre','telefono','fecha','hora','personas','descripcion','estado','mesa_id','pedido_id'])assert.match(sql,new RegExp(`\\b${col}\\b`));
 for(const f of ['nueva-reserva','mis-reservas']){const src=readFileSync(new URL(`../src/controllers/paginas__reservas__${f}__${f}.js`,import.meta.url),'utf8');assert.doesNotMatch(src,/localStorage|la_fonda_reservas/);}
 assert.match(sql,/enable row level security/);assert.doesNotMatch(sql,/\b(?:alter table|drop table) public\.(?:clientes|mesas|pedidos)\b/i);
});
