import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepararNotificacion,tiposNotificacion} from '../src/services/mensajes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const base={tipo:'PERSONALIZADA',categoria:' Evento especial ',titulo:'  Invitación ',mensaje:' Hola, tenemos novedades. ',audiencia:'INDIVIDUAL',destinatario:' Cliente@ejemplo.invalid '};
test('notificación personalizada conserva categoría, título, texto y destinatario normalizado',()=>{
 assert.deepEqual(prepararNotificacion(base),{p_tipo:'PERSONALIZADA',p_categoria:'Evento especial',p_titulo:'Invitación',p_mensaje:'Hola, tenemos novedades.',p_audiencia:'INDIVIDUAL',p_destinatario:'cliente@ejemplo.invalid'});
 assert.equal(tiposNotificacion.PERSONALIZADA.icono,'envelope');
});
test('notificaciones validan categorías, límites, destino y evitan difusión publicitaria a todos',()=>{
 for(const alter of [{tipo:'RESPUESTA'},{tipo:'INVALIDA'},{categoria:''},{titulo:'x'},{mensaje:'x'.repeat(1501)},{destinatario:'incorrecto'},{audiencia:'ACTIVOS'},{audiencia:'OTRA'}]) assert.throws(()=>prepararNotificacion({...base,...alter}));
 const aviso=prepararNotificacion({...base,tipo:'AVISO',audiencia:'ACTIVOS'});assert.equal(aviso.p_categoria,null);assert.equal(aviso.p_destinatario,null);
 const promo=prepararNotificacion({...base,tipo:'PROMOCION',audiencia:'SUSCRITOS'});assert.equal(promo.p_destinatario,null);
});
test('campana única y bandeja renderiza tipo personalizado sin HTML',()=>{
 const nav=read('src/components/Navbar.jsx');assert.equal([...nav.matchAll(/to="\/paginas\/notificaciones\/"/g)].length,1);assert.match(nav,/fa-regular fa-bell/);
 const inbox=read('src/pages/Notificaciones.jsx');assert.match(inbox,/n\.categoria/);assert.doesNotMatch(inbox,/dangerouslySetInnerHTML/);
});
test('SQL v2 reutiliza web_login, no acepta rol del navegador, conserva permisos y datos existentes',()=>{
 const sql=read('integracion-mensajes/03_notificaciones_personalizadas.sql');assert.match(sql,/public\.web_login\(p_email=>trim\(p_email\),p_password=>p_password\)/);assert.match(sql,/coalesce\(v->>'ok','false'\) <> 'true'/);assert.match(sql,/upper\(trim\(coalesce\(v->>'rol',''\)\)\) <> p_rol/);assert.match(sql,/coincidencias>1/);assert.match(sql,/upper\(trim\(u\.rol\)\)='ADMIN' and u\.activo is true/);assert.match(sql,/respondido_email=lower\(trim\(p_email\)\)/);assert.match(sql,/c\.id::text=v->>'id'/);assert.doesNotMatch(sql,/\b(?:alter|drop|truncate) table public\.(?:clientes|usuarios|reservas_web|mesas|pedidos|platos)\b/i);assert.match(sql,/revoke all on function public\.lf_mensajes_actor/);
});
test('SQL v2 exige administrador, consentimiento, auditoría e idempotencia del envío',()=>{
 const sql=read('integracion-mensajes/03_notificaciones_personalizadas.sql');assert.match(sql,/a:=public\.lf_mensajes_actor\(p_email,p_password,'ADMIN'\)/);assert.match(sql,/p_audiencia='ACTIVOS' and p_tipo<>'AVISO'/);assert.match(sql,/p\.promociones is true/);assert.match(sql,/pg_advisory_xact_lock/);assert.match(sql,/anterior\.administrador_email is not distinct from correo/);assert.match(sql,/where n\.cliente_id=c/);assert.match(sql,/grant execute on function public\.lf_notificacion_enviar/);
});
