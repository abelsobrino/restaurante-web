// Reglas compartidas por la tarjeta, el formulario y la advertencia de pedidos.
// El servidor repite las validaciones: este módulo no es una barrera de seguridad.
export const ZONA_HORARIA = 'America/Lima';
export const PERMANENCIA_MINUTOS = 90;
export const INTERVALO_MINUTOS = 30;

export function horaAMinutos(valor) {
    const texto = String(valor ?? '').trim();
    const partes = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(texto);
    if (!partes) return null;
    const hora = Number(partes[1]);
    const minuto = Number(partes[2]);
    return hora < 24 && minuto < 60 ? hora * 60 + minuto : null;
}
export function minutosAHora(minutos) {
    if (!Number.isFinite(minutos) || minutos < 0 || minutos >= 1440) return null;
    return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}
export function fechaLima(ahora = new Date()) {
    const partes = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(ahora).map(parte => [parte.type, parte.value]));
    return `${partes.year}-${partes.month}-${partes.day}`;
}
export function horaLima(ahora = new Date()) {
    const partes = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: ZONA_HORARIA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(ahora).map(parte => [parte.type, parte.value]));
    return `${partes.hour}:${partes.minute}`;
}
export function fechaMasDias(fecha, dias = 0) {
    const base = new Date(`${fecha}T12:00:00Z`);
    if (Number.isNaN(base.getTime())) return null;
    base.setUTCDate(base.getUTCDate() + dias);
    return base.toISOString().slice(0, 10);
}
export function diaSemanaISO(fecha) {
    const dia = new Date(`${fecha}T12:00:00Z`).getUTCDay();
    return dia === 0 ? 7 : dia;
}
export function horarioDeFecha(configuracion, fecha) {
    if (!configuracion || !Array.isArray(configuracion.dias)) return null;
    const especial = (configuracion.excepciones || []).find(item => item.fecha === fecha);
    const semanal = (configuracion.dias || []).find(item => Number(item.dia_semana) === diaSemanaISO(fecha));
    const horario = especial || semanal;
    if (!horario) return null;
    const apertura = horaAMinutos(horario.hora_apertura);
    const cierre = horaAMinutos(horario.hora_cierre);
    const cerrado = horario.cerrado === true || configuracion.activo === false;
    const ultima = cierre == null ? null : Math.floor((cierre - PERMANENCIA_MINUTOS) / INTERVALO_MINUTOS) * INTERVALO_MINUTOS;
    return { fecha, cerrado: cerrado || apertura === null || cierre === null || ultima < apertura,
        apertura, cierre, ultima, excepcional: Boolean(especial) };
}
export function proximosHorarios(configuracion, desde = fechaLima(), total = 8) {
    return Array.from({length: total}, (_, i) => horarioDeFecha(configuracion, fechaMasDias(desde, i)));
}
export function evaluarReserva(configuracion, fecha, hora, ahora = new Date()) {
    const horario = horarioDeFecha(configuracion, fecha);
    if (!horario) return { ok: false, mensaje: 'No se pudo verificar el horario. Inténtalo nuevamente.' };
    if (horario.cerrado) return { ok: false, mensaje: 'El restaurante no recibe reservas en esta fecha.' };
    const minutos = horaAMinutos(hora);
    if (minutos === null || minutos % INTERVALO_MINUTOS !== 0 || minutos < horario.apertura || minutos > horario.ultima) {
        return { ok: false, mensaje: `Elige un horario entre ${minutosAHora(Math.ceil(horario.apertura / 30) * 30)} y ${minutosAHora(horario.ultima)}, cada 30 minutos.` };
    }
    const hoy = fechaLima(ahora);
    if (fecha < hoy || (fecha === hoy && minutos <= horaAMinutos(horaLima(ahora)))) {
        return { ok: false, mensaje: 'Selecciona una fecha y hora futuras (hora de Lima).' };
    }
    return { ok: true, mensaje: '' };
}
export function siguientesTurnos(configuracion, fecha, ahora = new Date()) {
    const h = horarioDeFecha(configuracion, fecha);
    if (!h || h.cerrado) return [];
    const horas = [];
    for (let m = Math.ceil(h.apertura / INTERVALO_MINUTOS) * INTERVALO_MINUTOS; m <= h.ultima; m += INTERVALO_MINUTOS) {
        const hora = minutosAHora(m);
        if (evaluarReserva(configuracion, fecha, hora, ahora).ok) horas.push(hora);
    }
    return horas;
}
export function resumenProximaApertura(configuracion, ahora = new Date()) {
    if (!configuracion) return 'Consulta nuestros horarios de atención.';
    const hoy = fechaLima(ahora);
    const hoyMinutos = horaAMinutos(horaLima(ahora));
    for (let i = 0; i < 15; i++) {
        const fecha = fechaMasDias(hoy, i);
        const h = horarioDeFecha(configuracion, fecha);
        if (h && !h.cerrado && (i !== 0 || h.apertura > hoyMinutos)) {
            const fechaTexto = new Intl.DateTimeFormat('es-PE', {weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'}).format(new Date(`${fecha}T12:00:00Z`));
            return `${fechaTexto}: ${minutosAHora(h.apertura)} – ${minutosAHora(h.cierre)}`;
        }
    }
    return 'Consulta con el restaurante el próximo horario disponible.';
}
