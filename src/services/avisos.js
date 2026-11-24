// Diálogo compacto reutilizable, accesible y sin interpolar HTML externo.
export function mostrarAviso({ titulo, mensaje, detalle = '', icono = 'fa-clock', id = 'lf-aviso-horario' }) {
    document.getElementById(id)?.remove();
    const capa = document.createElement('div');
    capa.id = id;
    capa.className = 'lf-horario-overlay';
    capa.innerHTML = `<section class="lf-horario-dialogo" role="dialog" aria-modal="true" aria-labelledby="${id}-titulo" tabindex="-1">
      <button class="lf-horario-cerrar" type="button" aria-label="Cerrar aviso"><i class="fa-solid fa-xmark"></i></button>
      <div class="lf-horario-icono"><i class="fa-solid ${icono}"></i></div>
      <h2 id="${id}-titulo"></h2><p class="lf-horario-mensaje"></p>
      <p class="lf-horario-detalle"></p><button type="button" class="lf-horario-aceptar">Entendido</button>
    </section>`;
    capa.querySelector('h2').textContent = titulo;
    capa.querySelector('.lf-horario-mensaje').textContent = mensaje;
    capa.querySelector('.lf-horario-detalle').textContent = detalle;
    const anterior = document.activeElement;
    const cerrar = () => { capa.remove(); document.removeEventListener('keydown', teclado); if (anterior?.isConnected) anterior.focus(); };
    const teclado = event => { if (event.key === 'Escape') cerrar(); };
    capa.querySelector('.lf-horario-cerrar').addEventListener('click', cerrar);
    capa.querySelector('.lf-horario-aceptar').addEventListener('click', cerrar);
    capa.addEventListener('click', event => { if (event.target === capa) cerrar(); });
    document.addEventListener('keydown', teclado);
    document.body.appendChild(capa);
    capa.querySelector('.lf-horario-cerrar').focus();
    return cerrar;
}
