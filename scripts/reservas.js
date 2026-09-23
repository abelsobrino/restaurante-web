<<<<<<< HEAD
console.log("[Reservas] Inicializando módulo de reservas...");

function safeToast(message, type = "success") {
  console.log(`[Reservas] Toast: ${message} (${type})`);
  if (typeof launchToast === "function") {
    launchToast(message, type);
  } else {
    alert(message);
  }
}

function cargarReservas() {
  console.log("[Reservas] Cargando reservas del localStorage");
  const data = JSON.parse(localStorage.getItem("la_fonda_reservas") || "[]");
  console.log(`[Reservas] ${data.length} reservas cargadas`);
  return data;
}

function guardarReservas(reservas) {
  console.log(
    `[Reservas] Guardando ${reservas.length} reservas en localStorage`,
  );
  localStorage.setItem("la_fonda_reservas", JSON.stringify(reservas));
}

function getCurrentUserReservas() {
  console.log("[Reservas] Obteniendo reservas del usuario actual");
  const userData = JSON.parse(localStorage.getItem("la_fonda_user") || "null");
  if (!userData) {
    console.log("[Reservas] No hay usuario logueado");
    return [];
  }
  const todas = cargarReservas();
  const userReservas = todas.filter((r) => r.email === userData.email);
  console.log(
    `[Reservas] Usuario ${userData.email} tiene ${userReservas.length} reservas`,
  );
  return userReservas;
}

function renderizarMisReservas() {
  console.log("[Reservas] Renderizando lista de reservas");
  const section = document.getElementById("mis-reservas-section");
  const list = document.getElementById("mis-reservas-list");
  if (!section || !list) {
    console.warn("[Reservas] Elementos del DOM no encontrados");
    return;
  }

  const userData = JSON.parse(localStorage.getItem("la_fonda_user") || "null");
  if (!userData) {
    console.log("[Reservas] Ocultando sección - usuario no logueado");
    section.style.display = "none";
    return;
  }

  const reservas = getCurrentUserReservas();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const activas = reservas.filter((r) => {
    const fechaReserva = new Date(r.fecha + "T" + r.hora);
    return fechaReserva >= hoy;
  });

  const pasadas = reservas.filter((r) => {
    const fechaReserva = new Date(r.fecha + "T" + r.hora);
    return fechaReserva < hoy;
  });

  console.log(
    `[Reservas] Activas: ${activas.length}, Pasadas: ${pasadas.length}`,
  );

  if (reservas.length === 0) {
    console.log("[Reservas] No hay reservas para mostrar");
    section.style.display = "block";
    list.innerHTML = `
=======
// ============================================================ //
// MÓDULO DE RESERVAS - Sabor y Estilo
// ============================================================ //

console.log('[Reservas] Inicializando módulo de reservas...');

function safeToast(message, type = 'success') {
    console.log(`[Reservas] Toast: ${message} (${type})`);
    if (typeof launchToast === 'function') {
        launchToast(message, type);
    } else {
        alert(message);
    }
}

function cargarReservas() {
    console.log('[Reservas] Cargando reservas del localStorage');
    const data = JSON.parse(localStorage.getItem('sabor_estilo_reservas') || '[]');
    console.log(`[Reservas] ${data.length} reservas cargadas`);
    return data;
}

function guardarReservas(reservas) {
    console.log(`[Reservas] Guardando ${reservas.length} reservas en localStorage`);
    localStorage.setItem('sabor_estilo_reservas', JSON.stringify(reservas));
}

function getCurrentUserReservas() {
    console.log('[Reservas] Obteniendo reservas del usuario actual');
    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    if (!userData) {
        console.log('[Reservas] No hay usuario logueado');
        return [];
    }
    const todas = cargarReservas();
    const userReservas = todas.filter(r => r.email === userData.email);
    console.log(`[Reservas] Usuario ${userData.email} tiene ${userReservas.length} reservas`);
    return userReservas;
}

function renderizarMisReservas() {
    console.log('[Reservas] Renderizando lista de reservas');
    const section = document.getElementById('mis-reservas-section');
    const list = document.getElementById('mis-reservas-list');
    if (!section || !list) {
        console.warn('[Reservas] Elementos del DOM no encontrados');
        return;
    }

    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    if (!userData) {
        console.log('[Reservas] Ocultando sección - usuario no logueado');
        section.style.display = 'none';
        return;
    }

    const reservas = getCurrentUserReservas();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const activas = reservas.filter(r => {
        const fechaReserva = new Date(r.fecha + 'T' + r.hora);
        return fechaReserva >= hoy;
    });

    const pasadas = reservas.filter(r => {
        const fechaReserva = new Date(r.fecha + 'T' + r.hora);
        return fechaReserva < hoy;
    });

    console.log(`[Reservas] Activas: ${activas.length}, Pasadas: ${pasadas.length}`);

    if (reservas.length === 0) {
        console.log('[Reservas] No hay reservas para mostrar');
        section.style.display = 'block';
        list.innerHTML = `
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
            <div class="reserva-vacia">
                <p>📅 No tienes reservas activas</p>
                <p style="font-size: 0.8rem;">¡Anímate y reserva tu mesa ahora!</p>
            </div>
        `;
<<<<<<< HEAD
    return;
  }

  section.style.display = "block";
  let html = "";

  if (activas.length > 0) {
    html += `<h4 style="color: var(--accent); margin: 10px 0 8px;">Activas</h4>`;
    activas.forEach((r, index) => {
      html += crearTarjetaReserva(r, index, false);
    });
  }

  if (pasadas.length > 0) {
    html += `<h4 style="color: var(--text-gray); margin: 15px 0 8px;">Historial</h4>`;
    pasadas.forEach((r, index) => {
      html += crearTarjetaReserva(r, index, true);
    });
  }

  list.innerHTML = html;

  document.querySelectorAll(".btn-cancelar-reserva").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = Number.parseInt(this.dataset.index);
      console.log(`[Reservas] Click en cancelar reserva índice: ${index}`);
      cancelarReserva(index);
    });
  });
}

function crearTarjetaReserva(reserva, index, esPasada) {
  const fechaFormateada = new Date(reserva.fecha).toLocaleDateString("es-ES", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const horaFormateada = reserva.hora.substring(0, 5);

  console.log(
    `[Reservas] Creando tarjeta para reserva: ${reserva.nombre} - ${fechaFormateada}`,
  );

  return `
        <div class="reserva-card ${esPasada ? "reserva-pasada" : ""}">
=======
        return;
    }

    section.style.display = 'block';
    let html = '';

    if (activas.length > 0) {
        html += `<h4 style="color: var(--accent); margin: 10px 0 8px;">📌 Activas</h4>`;
        activas.forEach((r, index) => {
            html += crearTarjetaReserva(r, index, false);
        });
    }

    if (pasadas.length > 0) {
        html += `<h4 style="color: var(--text-gray); margin: 15px 0 8px;">📜 Historial</h4>`;
        pasadas.forEach((r, index) => {
            html += crearTarjetaReserva(r, index, true);
        });
    }

    list.innerHTML = html;

    document.querySelectorAll('.btn-cancelar-reserva').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = Number.parseInt(this.dataset.index);
            console.log(`[Reservas] Click en cancelar reserva índice: ${index}`);
            cancelarReserva(index);
        });
    });
}

function crearTarjetaReserva(reserva, index, esPasada) {
    const fechaFormateada = new Date(reserva.fecha).toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    const horaFormateada = reserva.hora.substring(0, 5);

    console.log(`[Reservas] Creando tarjeta para reserva: ${reserva.nombre} - ${fechaFormateada}`);

    return `
        <div class="reserva-card ${esPasada ? 'reserva-pasada' : ''}">
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
            <div class="reserva-header">
                <span class="reserva-fecha">📅 ${fechaFormateada}</span>
                <span class="reserva-hora">🕐 ${horaFormateada}</span>
            </div>
            <div class="reserva-body">
                <p><strong>👤 ${reserva.nombre}</strong> · 🪑 ${reserva.sillas} sillas</p>
<<<<<<< HEAD
                ${reserva.descripcion ? `<p class="reserva-desc">💬 ${reserva.descripcion}</p>` : ""}
                <p class="reserva-estado ${esPasada ? "estado-pasado" : "estado-activo"}">
                    ${esPasada ? "Completada" : "Activa"}
                </p>
            </div>
            ${
              !esPasada
                ? `
                <div class="reserva-footer">
                    <button class="btn-cancelar-reserva" data-index="${index}">Cancelar</button>
                </div>
            `
                : ""
            }
=======
                ${reserva.descripcion ? `<p class="reserva-desc">💬 ${reserva.descripcion}</p>` : ''}
                <p class="reserva-estado ${esPasada ? 'estado-pasado' : 'estado-activo'}">
                    ${esPasada ? '✅ Completada' : '🟢 Activa'}
                </p>
            </div>
            ${!esPasada ? `
                <div class="reserva-footer">
                    <button class="btn-cancelar-reserva" data-index="${index}">Cancelar</button>
                </div>
            ` : ''}
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
        </div>
    `;
}

function cancelarReserva(index) {
<<<<<<< HEAD
  console.log(`[Reservas] Cancelando reserva índice: ${index}`);

  if (!confirm("¿Cancelar esta reserva?")) {
    console.log("[Reservas] Cancelación abortada por usuario");
    return;
  }

  const reservas = cargarReservas();
  const userData = JSON.parse(localStorage.getItem("la_fonda_user") || "null");

  const userReservas = reservas.filter((r) => r.email === userData.email);
  if (index >= userReservas.length) {
    console.warn("[Reservas] Índice de reserva inválido");
    safeToast("Reserva no encontrada", "error");
    return;
  }

  const reservaAEliminar = userReservas[index];
  console.log(
    `[Reservas] Eliminando reserva: ${reservaAEliminar.nombre} - ${reservaAEliminar.fecha}`,
  );

  const reservaOriginalIndex = reservas.findIndex(
    (r) =>
      r.email === reservaAEliminar.email &&
      r.fecha === reservaAEliminar.fecha &&
      r.hora === reservaAEliminar.hora &&
      r.nombre === reservaAEliminar.nombre,
  );

  if (reservaOriginalIndex !== -1) {
    reservas.splice(reservaOriginalIndex, 1);
    guardarReservas(reservas);
    safeToast("Reserva cancelada");
    renderizarMisReservas();
    console.log("[Reservas] Reserva cancelada exitosamente");
  } else {
    console.warn(
      "[Reservas] Error al encontrar la reserva en el array original",
    );
    safeToast("Error al cancelar", "error");
  }
}

function crearReserva(e) {
  e.preventDefault();
  console.log("[Reservas] Procesando creación de nueva reserva");

  const userData = JSON.parse(localStorage.getItem("la_fonda_user") || "null");
  if (!userData) {
    console.warn("[Reservas] Intento de reserva sin sesión");
    safeToast("Inicia sesión para reservar", "error");
    setTimeout(() => {
      console.log("[Reservas] Redirigiendo a registro");
      window.location.href = "/src/modulo_auth/registrarse.html";
    }, 1500);
    return;
  }

  const nombre = document.getElementById("res-nombre").value.trim();
  const email = document.getElementById("res-email").value.trim();
  const telefono = document.getElementById("res-telefono").value.trim();
  const fecha = document.getElementById("res-fecha").value;
  const hora = document.getElementById("res-hora").value;
  const sillas = Number.parseInt(document.getElementById("res-sillas").value);
  const descripcion = document.getElementById("res-descripcion").value.trim();

  console.log(
    `[Reservas] Datos recibidos: ${nombre}, ${email}, ${fecha}, ${hora}, ${sillas} sillas`,
  );

  if (!nombre || !email || !telefono || !fecha || !hora || !sillas) {
    console.warn("[Reservas] Campos obligatorios incompletos");
    safeToast("Completa todos los campos obligatorios", "error");
    return;
  }

  const emailValido = email.includes("@") && email.includes(".");
  if (emailValido) {
    console.log("[Reservas] Email válido");
  } else {
    console.warn("[Reservas] Email inválido");
    safeToast("Email inválido (debe contener @ y .)", "error");
    return;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaReserva = new Date(fecha);
  if (fechaReserva < hoy) {
    console.warn("[Reservas] Fecha pasada seleccionada");
    safeToast("No se pueden reservar en fechas pasadas", "error");
    return;
  }

  const horaNum = Number.parseInt(hora.split(":")[0]);
  const horaValida = horaNum >= 12 && horaNum <= 23;
  if (horaValida) {
    console.log("[Reservas] Hora válida");
  } else {
    console.warn("[Reservas] Hora fuera de rango");
    safeToast("Horario: 12:00 PM - 11:00 PM", "error");
    return;
  }

  const sillasValidas = sillas >= 1 && sillas <= 20;
  if (sillasValidas) {
    console.log("[Reservas] Número de sillas válido");
  } else {
    console.warn("[Reservas] Número de sillas fuera de rango");
    safeToast("Sillas: entre 1 y 20", "error");
    return;
  }

  const reservas = cargarReservas();
  const duplicada = reservas.some((r) => r.fecha === fecha && r.hora === hora);
  if (duplicada) {
    console.warn("[Reservas] Conflicto de horario detectado");
    safeToast("Ya hay una reserva en esa fecha y hora", "error");
    return;
  }

  const nuevaReserva = {
    nombre,
    email,
    telefono,
    fecha,
    hora,
    sillas,
    descripcion: descripcion || "Sin comentarios",
    fechaCreacion: new Date().toISOString(),
  };

  console.log("[Reservas] Nueva reserva creada:", nuevaReserva);
  reservas.push(nuevaReserva);
  guardarReservas(reservas);

  safeToast("¡Reserva creada con éxito! Te esperamos.");
  document.getElementById("reserva-form").reset();
  renderizarMisReservas();
  console.log("[Reservas] Proceso de creación completado exitosamente");
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("[Reservas] DOM cargado, inicializando eventos");

  const form = document.getElementById("reserva-form");
  if (form) {
    form.addEventListener("submit", crearReserva);
    console.log("[Reservas] Evento submit añadido al formulario");
  } else {
    console.warn("[Reservas] Formulario de reserva no encontrado");
  }

  const fechaInput = document.getElementById("res-fecha");
  if (fechaInput) {
    const hoy = new Date().toISOString().split("T")[0];
    fechaInput.setAttribute("min", hoy);
    console.log(`[Reservas] Fecha mínima establecida: ${hoy}`);
  }

  const horaInput = document.getElementById("res-hora");
  if (horaInput) {
    horaInput.setAttribute("min", "12:00");
    horaInput.setAttribute("max", "23:00");
    console.log("[Reservas] Rango de horas establecido: 12:00 - 23:00");
  }

  renderizarMisReservas();

  window.addEventListener("storage", function (e) {
    console.log(`[Reservas] Evento storage: ${e.key} actualizado`);
    if (e.key === "la_fonda_user" || e.key === "la_fonda_reservas") {
      console.log("[Reservas] Actualizando vista por cambios en storage");
      renderizarMisReservas();
    }
  });

  console.log("[Reservas] Módulo inicializado correctamente");
});
=======
    console.log(`[Reservas] Cancelando reserva índice: ${index}`);
    
    if (!confirm('¿Cancelar esta reserva?')) {
        console.log('[Reservas] Cancelación abortada por usuario');
        return;
    }

    const reservas = cargarReservas();
    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');

    const userReservas = reservas.filter(r => r.email === userData.email);
    if (index >= userReservas.length) {
        console.warn('[Reservas] Índice de reserva inválido');
        safeToast('Reserva no encontrada', 'error');
        return;
    }

    const reservaAEliminar = userReservas[index];
    console.log(`[Reservas] Eliminando reserva: ${reservaAEliminar.nombre} - ${reservaAEliminar.fecha}`);
    
    const reservaOriginalIndex = reservas.findIndex(r =>
        r.email === reservaAEliminar.email &&
        r.fecha === reservaAEliminar.fecha &&
        r.hora === reservaAEliminar.hora &&
        r.nombre === reservaAEliminar.nombre
    );

    if (reservaOriginalIndex !== -1) {
        reservas.splice(reservaOriginalIndex, 1);
        guardarReservas(reservas);
        safeToast('✅ Reserva cancelada');
        renderizarMisReservas();
        console.log('[Reservas] Reserva cancelada exitosamente');
    } else {
        console.warn('[Reservas] Error al encontrar la reserva en el array original');
        safeToast('Error al cancelar', 'error');
    }
}

function crearReserva(e) {
    e.preventDefault();
    console.log('[Reservas] Procesando creación de nueva reserva');

    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    if (!userData) {
        console.warn('[Reservas] Intento de reserva sin sesión');
        safeToast('⚠️ Inicia sesión para reservar', 'error');
        setTimeout(() => {
            console.log('[Reservas] Redirigiendo a registro');
            window.location.href = '/src/modulo_auth/registrarse.html';
        }, 1500);
        return;
    }

    const nombre = document.getElementById('res-nombre').value.trim();
    const email = document.getElementById('res-email').value.trim();
    const telefono = document.getElementById('res-telefono').value.trim();
    const fecha = document.getElementById('res-fecha').value;
    const hora = document.getElementById('res-hora').value;
    const sillas = Number.parseInt(document.getElementById('res-sillas').value);
    const descripcion = document.getElementById('res-descripcion').value.trim();

    console.log(`[Reservas] Datos recibidos: ${nombre}, ${email}, ${fecha}, ${hora}, ${sillas} sillas`);

    if (!nombre || !email || !telefono || !fecha || !hora || !sillas) {
        console.warn('[Reservas] Campos obligatorios incompletos');
        safeToast('Completa todos los campos obligatorios', 'error');
        return;
    }

    const emailValido = email.includes('@') && email.includes('.');
    if (emailValido) {
        console.log('[Reservas] Email válido');
    } else {
        console.warn('[Reservas] Email inválido');
        safeToast('Email inválido (debe contener @ y .)', 'error');
        return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(fecha);
    if (fechaReserva < hoy) {
        console.warn('[Reservas] Fecha pasada seleccionada');
        safeToast('No se pueden reservar en fechas pasadas', 'error');
        return;
    }

    const horaNum = Number.parseInt(hora.split(':')[0]);
    const horaValida = horaNum >= 12 && horaNum <= 23;
    if (horaValida) {
        console.log('[Reservas] Hora válida');
    } else {
        console.warn('[Reservas] Hora fuera de rango');
        safeToast('Horario: 12:00 PM - 11:00 PM', 'error');
        return;
    }

    const sillasValidas = sillas >= 1 && sillas <= 20;
    if (sillasValidas) {
        console.log('[Reservas] Número de sillas válido');
    } else {
        console.warn('[Reservas] Número de sillas fuera de rango');
        safeToast('Sillas: entre 1 y 20', 'error');
        return;
    }

    const reservas = cargarReservas();
    const duplicada = reservas.some(r => r.fecha === fecha && r.hora === hora);
    if (duplicada) {
        console.warn('[Reservas] Conflicto de horario detectado');
        safeToast('⚠️ Ya hay una reserva en esa fecha y hora', 'error');
        return;
    }

    const nuevaReserva = {
        nombre,
        email,
        telefono,
        fecha,
        hora,
        sillas,
        descripcion: descripcion || 'Sin comentarios',
        fechaCreacion: new Date().toISOString()
    };

    console.log('[Reservas] Nueva reserva creada:', nuevaReserva);
    reservas.push(nuevaReserva);
    guardarReservas(reservas);

    safeToast('✅ ¡Reserva creada con éxito! Te esperamos.');
    document.getElementById('reserva-form').reset();
    renderizarMisReservas();
    console.log('[Reservas] Proceso de creación completado exitosamente');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Reservas] DOM cargado, inicializando eventos');

    const form = document.getElementById('reserva-form');
    if (form) {
        form.addEventListener('submit', crearReserva);
        console.log('[Reservas] Evento submit añadido al formulario');
    } else {
        console.warn('[Reservas] Formulario de reserva no encontrado');
    }

    const fechaInput = document.getElementById('res-fecha');
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
        console.log(`[Reservas] Fecha mínima establecida: ${hoy}`);
    }

    const horaInput = document.getElementById('res-hora');
    if (horaInput) {
        horaInput.setAttribute('min', '12:00');
        horaInput.setAttribute('max', '23:00');
        console.log('[Reservas] Rango de horas establecido: 12:00 - 23:00');
    }

    renderizarMisReservas();

    window.addEventListener('storage', function(e) {
        console.log(`[Reservas] Evento storage: ${e.key} actualizado`);
        if (e.key === 'sabor_estilo_user' || e.key === 'sabor_estilo_reservas') {
            console.log('[Reservas] Actualizando vista por cambios en storage');
            renderizarMisReservas();
        }
    });

    console.log('[Reservas] Módulo inicializado correctamente');
});
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
