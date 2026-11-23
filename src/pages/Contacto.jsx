import React from "react";
import { PageView } from "../runtime/PageView.jsx";
import { setup as setup0 } from "../controllers/paginas__contacto__contacto.js";

const markup = `<main class="contacto">
<section class="contacto-seccion">
<div class="container contacto-grid">
<div class="contacto-info">
<h1 class="contacto-titulo">Contáctanos</h1>
<p class="contacto-descripcion">
    ¿Tienes alguna duda, sugerencia o deseas comunicarte con nuestro equipo? Déjanos tu mensaje y te responderemos lo antes posible.
</p>
<div class="contacto-info-lista">
<p>
<strong><i class="fa-solid fa-location-dot"></i> Ubicación:</strong>
    LA FONDA, Chaclacayo, Lima 15472, Perú
</p>
<p>
<strong><i class="fa-solid fa-clock"></i> Horario:</strong>
    Lun a Dom: 11:00 AM - 10:00 PM
</p>
<p>
<strong><i class="fa-solid fa-phone"></i> Teléfono:</strong>
    +51 987 654 321
</p>
<p>
<strong><i class="fa-solid fa-envelope"></i> Email:</strong>
    contacto@lafonda.com
</p>
</div>
<div class="contacto-mapa-mini">
<iframe allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249670.92109832214!2d-77.1431136918964!3d-12.104748669150277!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105e98091ba3567%3A0xb1b435c863911330!2sLA%20FONDA%20-%20FAST%20FOOD!5e0!3m2!1ses!2spe!4v1790134643217!5m2!1ses!2spe" title="Ubicación de La Fonda - Fast Food"></iframe>
</div>
</div>
<div class="contacto-formulario-card">
<div class="contacto-bloque-etiqueta">
<i class="fa-regular fa-envelope"></i>
<span>Contacto</span>
</div>
<form class="contacto-formulario" id="contacto-formulario">
<div class="contacto-campo">
<label for="contacto-nombre">Nombres completos</label>
<input id="contacto-nombre" maxlength="100" placeholder="Ingresa tus nombres completos" required="" type="text"/>
</div>
<div class="contacto-campo">
<label for="contacto-email">Correo electrónico</label>
<input id="contacto-email" maxlength="150" placeholder="ejemplo@correo.com" required="" type="email"/>
</div>
<div class="contacto-campo">
<label for="contacto-tipo">Tipo de mensaje</label>
<select id="contacto-tipo" required="">
<option disabled="" selected="" value="">Selecciona una opción</option>
<option value="consulta">Consulta</option>
<option value="sugerencia">Sugerencia</option>
<option value="queja">Incidencia</option>
<option value="felicitacion">Felicitación</option>
</select>
</div>
<div class="contacto-campo">
<label for="contacto-mensaje">Tu mensaje</label>
<textarea id="contacto-mensaje" maxlength="800" placeholder="Cuéntanos más..." required="" rows="5"></textarea>
<div class="contacto-contador">
<span id="contacto-contador">0</span> / 800
</div>
</div>
<p aria-live="polite" class="contacto-estado" id="contacto-estado"></p>
<p class="lf-contact-hint"><i class="fa-regular fa-bell"></i> Las respuestas llegarán a <a href="/paginas/notificaciones/">Notificaciones</a>.</p>
<button class="contacto-boton" id="contacto-enviar" type="submit">
    Enviar mensaje
</button>
</form>
</div>
</div>
</section>
</main>`;

const controllers = [setup0];

export default function Contacto(props) {
    return <PageView {...props} html={markup} controllers={controllers} />;
}
