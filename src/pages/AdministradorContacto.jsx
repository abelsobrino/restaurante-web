import React, {useCallback,useEffect,useRef,useState} from 'react';
import {PageView} from '../runtime/PageView.jsx';
import {setup} from '../controllers/paginas__administrador__admin.js';
import {mensajeRPC,confirmarAccion,errorMensajes,fechaMensaje,tiposNotificacion,prepararNotificacion} from '../services/mensajes.js';
const sidebar = '<div id="admin-menu"></div>';
const controllers=[setup];
const tipoNombre={consulta:'Consulta',sugerencia:'Sugerencia',queja:'Queja / reclamo',felicitacion:'Felicitación'};
const estados={PENDIENTE:'Pendiente',VISTO:'Visto',RESPONDIDO:'Respondido'};
function Icon({name}) {return <i className={'fa-solid fa-'+name} aria-hidden="true"/>;}
function Tarjeta({item,accion,ocupado}) {
    const [texto,setTexto]=useState('');
    const [abierto,setAbierto]=useState(false);
    return <article className="lf-msg-card">
        <div className="lf-msg-top"><div><span className="lf-msg-type"><Icon name="envelope"/> {tipoNombre[item.tipo]||item.tipo}</span><h3>{item.nombre}</h3><p className="lf-msg-muted">{item.email} · {fechaMensaje(item.creado_at)}</p></div><span className={'lf-msg-state '+item.estado.toLowerCase()}>{estados[item.estado]}</span></div>
        <p className="lf-msg-text">{item.mensaje}</p>
        {item.estado==='RESPONDIDO' ? <div className="lf-msg-response"><strong><Icon name="reply"/> Respuesta enviada</strong><p className="lf-msg-text">{item.respuesta}</p><small>{fechaMensaje(item.respondido_at)}</small></div> : <>
            <div className="lf-msg-actions">{item.estado==='PENDIENTE'&&<button type="button" disabled={ocupado} className="lf-msg-secondary" onClick={()=>accion('lf_contacto_visto',{p_id:item.id})}><Icon name="eye"/> Marcar visto</button>}<button type="button" disabled={ocupado} className="lf-msg-button" onClick={()=>setAbierto(x=>!x)}><Icon name="reply"/> {abierto?'Cerrar respuesta':'Responder'}</button></div>
            {abierto&&<form className="lf-msg-form" onSubmit={async e=>{e.preventDefault();if(texto.trim().length<2)return;if(await accion('lf_contacto_responder',{p_id:item.id,p_respuesta:texto.trim()})){setTexto('');setAbierto(false);}}}><label>Respuesta al cliente<textarea required minLength={2} maxLength={1500} rows={4} value={texto} onChange={e=>setTexto(e.target.value)}/></label><small>{texto.length}/1500</small><button type="submit" className="lf-msg-button" disabled={ocupado||texto.trim().length<2}><Icon name="paper-plane"/> Enviar respuesta</button></form>}
        </>}
    </article>;
}
export default function AdministradorContacto(props) {
    const [filtro,setFiltro]=useState('TODOS'),[items,setItems]=useState([]),[pendientes,setPendientes]=useState(null),[cursor,setCursor]=useState(null),[historia,setHistoria]=useState([]),[cargando,setCargando]=useState(true),[error,setError]=useState(''),[aviso,setAviso]=useState(''),[ocupado,setOcupado]=useState(false);
    const [titulo,setTitulo]=useState(''),[promo,setPromo]=useState(''),[tipo,setTipo]=useState('PROMOCION'),[categoria,setCategoria]=useState(''),[audiencia,setAudiencia]=useState('SUSCRITOS'),[destinatario,setDestinatario]=useState(''),[errorEnvio,setErrorEnvio]=useState(''),[avisoEnvio,setAvisoEnvio]=useState('');
    const envio=useRef(null),lock=useRef(false),seq=useRef(0),mounted=useRef(true);
    useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;seq.current++;};},[]);
    const cargar=useCallback(async()=>{const n=++seq.current;setCargando(true);setError('');try{const r=await mensajeRPC('ADMIN','lf_contacto_admin_lista',{p_estado:filtro,p_antes:cursor});if(!Array.isArray(r?.mensajes))throw new Error('Respuesta inválida');if(n===seq.current){setItems(r.mensajes);setPendientes(r.pendientes);}}catch(e){if(n===seq.current){setItems([]);setPendientes(null);setError(errorMensajes(e));}}finally{if(n===seq.current)setCargando(false);}},[filtro,cursor]);
    useEffect(()=>{cargar();return()=>{seq.current++;};},[cargar]);
    async function accion(fn,datos){if(lock.current)return false;lock.current=true;setOcupado(true);setAviso('');setError('');try{confirmarAccion(await mensajeRPC('ADMIN',fn,datos));if(!mounted.current)return false;setAviso(fn==='lf_contacto_responder'?'Respuesta enviada a Notificaciones.':'Mensaje marcado como visto.');await cargar();return true;}catch(e){if(mounted.current)setError(errorMensajes(e));return false;}finally{lock.current=false;if(mounted.current)setOcupado(false);}}
    async function enviarPromo(e){
        e.preventDefault(); if(lock.current)return;
        setErrorEnvio('');setAvisoEnvio('');
        let datos;try{datos=prepararNotificacion({tipo,categoria,titulo,mensaje:promo,audiencia,destinatario});}catch(e){setErrorEnvio(errorMensajes(e));return;}
        const publico=audiencia==='INDIVIDUAL'?datos.p_destinatario:audiencia==='ACTIVOS'?'todos los clientes activos (solo avisos de servicio)':'los clientes suscritos a novedades';
        if(!window.confirm(`¿Enviar esta notificación a ${publico}?`))return;
        const clave=JSON.stringify(datos);if(envio.current?.clave!==clave)envio.current={clave,id:crypto.randomUUID()};
        lock.current=true;setOcupado(true);
        try{const r=await mensajeRPC('ADMIN','lf_notificacion_enviar',{p_solicitud:envio.current.id,...datos});if(!Number.isInteger(r?.destinatarios)||r.destinatarios<0)throw new Error('El servidor no confirmó el envío');if(mounted.current){setAvisoEnvio(r.destinatarios===0?'No hay clientes elegibles; no se entregaron notificaciones.':`Notificación enviada a ${r.destinatarios} cliente(s).`);setTitulo('');setPromo('');setCategoria('');setDestinatario('');envio.current=null;}}catch(e){if(mounted.current)setErrorEnvio(errorMensajes(e));}finally{lock.current=false;if(mounted.current)setOcupado(false);}
    }
    return <main className="admin-page"><section className="admin-section"><div className="container admin-layout"><PageView {...props} html={sidebar} controllers={controllers}/><div className="admin-content lf-messages"><header className="admin-heading"><div><p className="admin-eyebrow">PANEL WEB</p><h1>Contáctanos</h1><p className="admin-muted">Bandeja de mensajes y comunicación con clientes.</p></div></header>
        <div className="lf-msg-summary"><Icon name="inbox"/><div><strong>{pendientes??'—'}</strong><small>Mensajes pendientes</small></div></div>
        <div className="lf-msg-actions lf-msg-toolbar"><label>Estado <select value={filtro} disabled={ocupado} onChange={e=>{setFiltro(e.target.value);setCursor(null);setHistoria([]);}}><option value="TODOS">Todos</option>{Object.entries(estados).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><button type="button" className="lf-msg-secondary" disabled={cargando||ocupado} onClick={cargar}><Icon name="arrows-rotate"/> Actualizar</button></div>
        <output className="lf-msg-success" style={{display:"block"}}>{aviso}</output>{error&&<p role="alert" className="lf-msg-error">{error}</p>}
        {cargando?<output className="lf-msg-muted" style={{display:"block"}}>Cargando mensajes...</output>:!items.length&&!error?<p className="lf-msg-empty">No hay mensajes en esta selección.</p>:null}
        <div className="lf-msg-list">{items.map(item=><Tarjeta key={item.id} item={item} accion={accion} ocupado={ocupado||cargando}/>)}</div>
        <div className="lf-msg-actions">{historia.length>0&&<button type="button" className="lf-msg-secondary" disabled={cargando||ocupado} onClick={()=>{setCursor(historia.at(-1));setHistoria(x=>x.slice(0,-1));}}>Anterior</button>}{items.length===50&&<button type="button" className="lf-msg-secondary" disabled={cargando||ocupado} onClick={()=>{setHistoria(x=>[...x,cursor]);setCursor(items.at(-1).id);}}>Siguiente</button>}</div>
        <section className="lf-msg-card lf-promo-box"><h2><Icon name="bullhorn"/> Crear notificación</h2><p className="lf-msg-muted">Personaliza el mensaje y elige a quién enviarlo. Los avisos de servicio no deben contener publicidad.</p><form className="lf-msg-form" onSubmit={enviarPromo}>
        <label>Tipo de notificación<select value={tipo} disabled={ocupado} onChange={e=>{setTipo(e.target.value);if(e.target.value!=='AVISO'&&audiencia==='ACTIVOS')setAudiencia('SUSCRITOS');}}>{Object.entries(tiposNotificacion).filter(([k])=>k!=='RESPUESTA').map(([k,v])=><option key={k} value={k}>{v.nombre}</option>)}</select></label>
        {tipo==='PERSONALIZADA'&&<label>Nombre de la categoría<input required minLength={2} maxLength={40} value={categoria} onChange={e=>setCategoria(e.target.value)} placeholder="Ej. evento especial"/></label>}
        <label>Destinatarios<select value={audiencia} disabled={ocupado} onChange={e=>setAudiencia(e.target.value)}><option value="SUSCRITOS">Clientes suscritos a novedades</option><option value="INDIVIDUAL">Un cliente por correo</option>{tipo==='AVISO'&&<option value="ACTIVOS">Todos los clientes activos (aviso de servicio)</option>}</select></label>
        {audiencia==='INDIVIDUAL'&&<label>Correo del cliente<input type="email" required maxLength={150} value={destinatario} onChange={e=>setDestinatario(e.target.value)}/></label>}
        <label>Título<input required maxLength={120} minLength={2} value={titulo} onChange={e=>setTitulo(e.target.value)}/></label><label>Mensaje<textarea required maxLength={1500} minLength={2} rows={4} value={promo} onChange={e=>setPromo(e.target.value)}/></label>
        <div className="lf-msg-response"><small>Vista previa de la notificación</small><h3><Icon name={tiposNotificacion[tipo].icono}/> {titulo.trim()||'Título de la notificación'}</h3><small>{tipo==='PERSONALIZADA'?(categoria.trim()||'Categoría personalizada'):tiposNotificacion[tipo].nombre}</small><p className="lf-msg-text">{promo.trim()||'Aquí aparecerá el mensaje.'}</p></div>
        {errorEnvio&&<p role="alert" className="lf-msg-error">{errorEnvio}</p>}<output className="lf-msg-success" style={{display:"block"}}>{avisoEnvio}</output><button type="submit" className="lf-msg-button" disabled={ocupado||cargando||pendientes===null||titulo.trim().length<2||promo.trim().length<2}><Icon name="paper-plane"/> Enviar notificación</button></form></section>
    </div></div></section></main>;
}
