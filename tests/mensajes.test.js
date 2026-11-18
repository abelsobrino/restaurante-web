import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setup} from '../src/controllers/paginas__contacto__contacto.js';
import {mensajeRPC,confirmarID,confirmarAccion} from '../src/services/mensajes.js';
import {findRoute} from '../src/routes.js';
import {adminMenu} from '../src/runtime/adminMenu.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function entorno(rpc,rol='CLIENTE'){
 const fields=new Map();const ready=[];const session=rol?{id:123,nombre:'Cliente',apellido:'Prueba',email:'cliente@example.invalid',password:'solo-prueba',rol,modo:rol}:null;
 const element=id=>{if(!fields.has(id))fields.set(id,{value:'',textContent:'',className:'',classList:{add(){}},listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return fields.get(id);};
 const form=element('contacto-formulario');form.querySelectorAll=()=>['contacto-nombre','contacto-email','contacto-tipo','contacto-mensaje','contacto-enviar'].map(element);form.reset=()=>{element('contacto-mensaje').value='';element('contacto-tipo').value='';};
 let redirected=false;const win={LaFondaAuth:{getSession:()=>session,requireLogin:()=>{redirected=true;}},LaFondaDB:{rpc}};
 globalThis.window=win;
 const scope={active:true,window:win,document:{getElementById:element,querySelectorAll:()=>[],addEventListener:(e,f)=>ready.push(f)},setTimeout,clearTimeout,setInterval,clearInterval};
 setup(scope);ready.forEach(f=>f());element('contacto-tipo').value='consulta';element('contacto-mensaje').value='Una consulta de prueba.';return {element,scope,send:()=>form.listeners.submit({preventDefault(){}}),redirected:()=>redirected};
}
test('contacto envía al servidor y exige identificador antes de confirmar',async()=>{
 let params;const e=entorno(async(fn,p)=>{assert.equal(fn,'lf_contacto_enviar');params=p;return '9007199254740995';});await e.send();assert.equal(params.p_tipo,'consulta');assert.equal(params.p_mensaje,'Una consulta de prueba.');assert.match(params.p_solicitud,/^[\da-f-]{36}$/i);assert.equal(params.p_email,'cliente@example.invalid');assert.ok(!('p_cliente_id' in params));assert.match(e.element('contacto-estado').textContent,/Mensaje enviado/);assert.equal(e.element('contacto-mensaje').value,'');delete globalThis.window;
});
test('contacto conserva formulario ante fallo o respuesta inválida y reintenta sin duplicar',async()=>{
 const ids=[];const e=entorno(async(fn,p)=>{ids.push(p.p_solicitud);if(ids.length===1)throw Error('offline');if(ids.length===2)return null;return '2';});await e.send();assert.equal(e.element('contacto-mensaje').value,'Una consulta de prueba.');assert.doesNotMatch(e.element('contacto-estado').textContent,/Mensaje enviado/);await e.send();assert.equal(e.element('contacto-mensaje').value,'Una consulta de prueba.');await e.send();assert.equal(new Set(ids).size,1);assert.match(e.element('contacto-estado').textContent,/Mensaje enviado/);delete globalThis.window;
});
test('doble envío y falta de sesión o rol no generan RPC adicionales',async()=>{
 let calls=0,finish;const e=entorno(()=>{calls++;return new Promise(r=>finish=r);});const first=e.send();await e.send();assert.equal(calls,1);finish('1');await first;
 const guest=entorno(()=>{calls++;},null);await guest.send();assert.equal(guest.redirected(),true);const admin=entorno(()=>{calls++;},'ADMIN');await admin.send();assert.equal(calls,1);delete globalThis.window;
});
test('cliente no invoca función de admin mediante servicio y no suplanta credenciales',async()=>{
 globalThis.window={LaFondaAuth:{getSession:()=>({rol:'CLIENTE',modo:'CLIENTE',email:'real@example.invalid',password:'demo'})},LaFondaDB:{rpc:async(fn,p)=>p}};
 await assert.rejects(mensajeRPC('ADMIN','lf_contacto_admin_lista'));
 const p=await mensajeRPC('CLIENTE','lf_notificaciones_contar',{p_email:'otro@example.invalid',p_password:'otra'});assert.equal(p.p_email,'real@example.invalid');assert.equal(p.p_password,'demo');assert.throws(()=>confirmarID(null));assert.throws(()=>confirmarAccion(false));delete globalThis.window;
});
test('rutas nuevas: admin protegido y bandeja exclusiva de cliente',()=>{
 assert.equal(findRoute('/paginas/administrador/contacto/').admin,true);assert.equal(findRoute('/paginas/notificaciones/index.html').cliente,true);assert.match(adminMenu,/data-admin-route="contacto"/);
 assert.match(read('src/App.jsx'),/route\.cliente/);assert.match(read('src/components/Navbar.jsx'),/lf_notificaciones_contar/);
});
test('contrato SQL: tablas nuevas cerradas, roles del servidor, lectura propia y respuesta atómica',()=>{
 const sql=read('integracion-mensajes/01_mensajes.sql');
 for(const t of ['lf_contactos','lf_notificaciones','lf_preferencias_notificaciones','lf_envios_promociones'])assert.match(sql,new RegExp(`alter table public\\.${t} enable row level security`));
 assert.doesNotMatch(sql,/\b(?:alter|drop|truncate) table public\.(?:clientes|usuarios|reservas_web|mesas|pedidos|platos)\b/i);
 assert.match(sql,/public\.web_login\(p_email=>trim\(p_email\),p_password=>p_password\)/);
 assert.match(sql,/where id=p_id and cliente_id=c/);assert.match(sql,/where n\.cliente_id=c/);assert.match(sql,/estado in \('PENDIENTE','VISTO'\) returning cliente_id into c/);assert.match(sql,/contacto_id bigint unique/);assert.match(sql,/p\.promociones is true/);
 assert.match(sql,/revoke all on function public\.lf_mensajes_actor\(text,text,text\) from public,anon,authenticated/);
 for(const fn of ['lf_contacto_enviar','lf_contacto_admin_lista','lf_contacto_visto','lf_contacto_responder','lf_notificaciones_lista','lf_notificaciones_contar','lf_notificacion_leer','lf_notificaciones_preferencia','lf_promocion_notificar'])assert.match(sql,new RegExp(`grant execute on function public\\.${fn}\\(`));
});
test('carta conserva RPC y usa carga de marca, stock en paralelo y accesibilidad',()=>{
 const src=read('src/controllers/paginas__menu__carta__carta.js');assert.ok(src.indexOf('prepararLecturaCatalogo')<src.indexOf('await LaFondaDB.rpc("web_catalogo"'));assert.match(src,/lf-brand-loader/);assert.match(src,/estado\.removeAttribute\("aria-busy"\)/);assert.match(read('public/css/mensajes.css'),/prefers-reduced-motion/);
});
