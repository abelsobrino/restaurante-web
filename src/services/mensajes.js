export function credencialesMensajes(rol) {
    const s = window.LaFondaAuth?.getSession();
    if (!s || s.rol !== rol || !s.email || !s.password || (rol === 'ADMIN' && s.modo !== 'ADMIN')) throw new Error('Inicia sesión con la cuenta correspondiente.');
    return {p_email:s.email,p_password:s.password};
}
export async function mensajeRPC(rol, nombre, datos = {}) {
    const cred = credencialesMensajes(rol);
    return window.LaFondaDB.rpc(nombre, {...datos,...cred});
}
export function confirmarID(id) {
    if (!((typeof id === 'string' && /^[1-9]\d*$/.test(id)) || (Number.isSafeInteger(id) && id > 0))) throw new Error('El servidor no confirmó el registro. Intenta nuevamente.');
    return String(id);
}
export function confirmarAccion(valor) {
    if (valor !== true) throw new Error('El servidor no confirmó la operación.');
}
export function errorMensajes(error) {
    const msg = String(error?.message || '');
    if (/schema cache|could not find|does not exist|PGRST/i.test(msg)) return 'El módulo de mensajes aún no está habilitado en Supabase.';
    if (/límite de 5|Acceso no autorizado|Sesión inválida|ya fue respondido|no confirmó|Inicia sesión|Cliente no disponible|consentimiento|Revisa los datos|Indica |Solicitud de envío|Todos los activos/.test(msg)) return msg;
    return 'No se pudo completar la operación. Comprueba tu conexión e inténtalo nuevamente.';
}
export function fechaMensaje(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Lima'}).format(date);
}
export function notificarCambio() { window.dispatchEvent(new Event('lafonda-notificaciones-change')); }

export const tiposNotificacion = Object.freeze({
    RESPUESTA:{nombre:'Respuesta',icono:'reply'}, PROMOCION:{nombre:'Promoción',icono:'tag'},
    AVISO:{nombre:'Aviso de servicio',icono:'bell'}, NOVEDAD:{nombre:'Novedad',icono:'bullhorn'},
    INFORMACION:{nombre:'Información',icono:'circle-info'}, PERSONALIZADA:{nombre:'Personalizada',icono:'envelope'}
});
export function prepararNotificacion({tipo,categoria,titulo,mensaje,audiencia,destinatario}) {
    const t=String(titulo||'').trim(), m=String(mensaje||'').trim(), cat=String(categoria||'').trim(), d=String(destinatario||'').trim();
    if (!Object.hasOwn(tiposNotificacion,tipo)||tipo==='RESPUESTA'||!['SUSCRITOS','INDIVIDUAL','ACTIVOS'].includes(audiencia)||t.length<2||t.length>120||m.length<2||m.length>1500) throw Error('Revisa los datos de la notificación');
    if(tipo==='PERSONALIZADA'&&(cat.length<2||cat.length>40)) throw Error('Indica una categoría de 2 a 40 caracteres');
    if(audiencia==='ACTIVOS'&&tipo!=='AVISO') throw Error('Todos los activos se reserva para avisos de servicio');
    if(audiencia==='INDIVIDUAL'&&(d.length>150||!/^\S+@\S+\.\S+$/.test(d))) throw Error('Indica el correo del cliente');
    return {p_tipo:tipo,p_categoria:tipo==='PERSONALIZADA'?cat:null,p_titulo:t,p_mensaje:m,p_audiencia:audiencia,p_destinatario:audiencia==='INDIVIDUAL'?d.toLowerCase():null};
}
