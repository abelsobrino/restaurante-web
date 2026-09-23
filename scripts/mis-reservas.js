<<<<<<< HEAD
console.log("[Mis Reservas] Inicializando...");

function cargarReservas() {
  return JSON.parse(localStorage.getItem("la_fonda_reservas") || "[]");
}

function getCurrentUserReservas() {
  const userData = JSON.parse(localStorage.getItem("la_fonda_user") || "null");
  if (!userData) return [];
  const todas = cargarReservas();
  return todas.filter((r) => r.email === userData.email);
}

function cancelarReserva(index) {
  if (!confirm("¿Estás seguro de que deseas cancelar esta reserva?")) return;

  const reservas = cargarReservas();
  const userData = JSON.parse(localStorage.getItem("la_fonda_user") || "null");
  if (!userData) return;

  const userReservas = reservas.filter((r) => r.email === userData.email);
  if (index >= userReservas.length) {
    alert("Reserva no encontrada");
    return;
  }

  const reservaAEliminar = userReservas[index];
  const reservaOriginalIndex = reservas.findIndex(
    (r) =>
      r.email === reservaAEliminar.email &&
      r.fecha === reservaAEliminar.fecha &&
      r.hora === reservaAEliminar.hora &&
      r.nombre === reservaAEliminar.nombre,
  );

  if (reservaOriginalIndex !== -1) {
    reservas.splice(reservaOriginalIndex, 1);
    localStorage.setItem("la_fonda_reservas", JSON.stringify(reservas));
    alert("Reserva cancelada correctamente");
    renderizarReservas();
  } else {
    alert("Error al cancelar la reserva");
  }
}

function renderizarReservas() {
  const container = document.getElementById("reservas-list");
  if (!container) return;

  const userData = JSON.parse(localStorage.getItem("la_fonda_user") || "null");

  if (!userData) {
    container.innerHTML = `
=======
// ============================================================ //
// MÓDULO: MIS RESERVAS - Sabor y Estilo
// ============================================================ //

console.log('[Mis Reservas] Inicializando...');

function cargarReservas() {
    return JSON.parse(localStorage.getItem('sabor_estilo_reservas') || '[]');
}

function getCurrentUserReservas() {
    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    if (!userData) return [];
    const todas = cargarReservas();
    return todas.filter(r => r.email === userData.email);
}

function cancelarReserva(index) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    const reservas = cargarReservas();
    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');
    if (!userData) return;

    const userReservas = reservas.filter(r => r.email === userData.email);
    if (index >= userReservas.length) {
        alert('Reserva no encontrada');
        return;
    }

    const reservaAEliminar = userReservas[index];
    const reservaOriginalIndex = reservas.findIndex(r =>
        r.email === reservaAEliminar.email &&
        r.fecha === reservaAEliminar.fecha &&
        r.hora === reservaAEliminar.hora &&
        r.nombre === reservaAEliminar.nombre
    );

    if (reservaOriginalIndex !== -1) {
        reservas.splice(reservaOriginalIndex, 1);
        localStorage.setItem('sabor_estilo_reservas', JSON.stringify(reservas));
        alert('✅ Reserva cancelada correctamente');
        renderizarReservas();
    } else {
        alert('Error al cancelar la reserva');
    }
}

function renderizarReservas() {
    const container = document.getElementById('reservas-list');
    if (!container) return;

    const userData = JSON.parse(localStorage.getItem('sabor_estilo_user') || 'null');

    if (!userData) {
        container.innerHTML = `
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
            <div class="reserva-vacia">
                <p style="font-size: 2rem; margin-bottom: 15px;">🔒</p>
                <p style="font-size: 1.2rem; color: var(--text-gray);">Inicia sesión para ver tus reservas</p>
                <a href="/src/modulo_auth/registrarse.html" class="btn-order" style="margin-top: 20px; display: inline-block;">Iniciar Sesión</a>
            </div>
        `;
<<<<<<< HEAD
    return;
  }

  const reservas = getCurrentUserReservas();

  if (reservas.length === 0) {
    container.innerHTML = `
=======
        return;
    }

    const reservas = getCurrentUserReservas();

    if (reservas.length === 0) {
        container.innerHTML = `
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
            <div class="reserva-vacia">
                <p style="font-size: 2rem; margin-bottom: 15px;">📅</p>
                <p style="font-size: 1.2rem; color: var(--text-gray);">No tienes reservas aún</p>
                <p style="color: var(--text-gray); font-size: 0.9rem;">¡Reserva tu mesa ahora!</p>
                <a href="/src/modulo_feedback/contactanos.html" class="btn-order" style="margin-top: 20px; display: inline-block;">Hacer una Reserva</a>
            </div>
        `;
<<<<<<< HEAD
    return;
  }

  reservas.sort((a, b) => {
    const fechaA = new Date(a.fecha + "T" + a.hora);
    const fechaB = new Date(b.fecha + "T" + b.hora);
    return fechaB - fechaA;
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let html = '<div class="reservas-grid">';

  reservas.forEach((reserva, index) => {
    const fechaReserva = new Date(reserva.fecha + "T" + reserva.hora);
    const esPasada = fechaReserva < hoy;

    const fechaFormateada = new Date(reserva.fecha).toLocaleDateString(
      "es-ES",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    const horaFormateada = reserva.hora.substring(0, 5);

    html += `
            <div class="reserva-card ${esPasada ? "reserva-pasada" : "reserva-activa"}">
                <div class="reserva-header">
                    <span class="reserva-fecha">📅 ${fechaFormateada}</span>
                    <span class="reserva-hora">🕐 ${horaFormateada}</span>
                    <span class="reserva-estado ${esPasada ? "estado-pasado" : "estado-activo"}">
                        ${esPasada ? "✅ Completada" : "🟢 Activa"}
=======
        return;
    }

    // Ordenar por fecha (más reciente primero)
    reservas.sort((a, b) => {
        const fechaA = new Date(a.fecha + 'T' + a.hora);
        const fechaB = new Date(b.fecha + 'T' + b.hora);
        return fechaB - fechaA;
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let html = '<div class="reservas-grid">';

    reservas.forEach((reserva, index) => {
        const fechaReserva = new Date(reserva.fecha + 'T' + reserva.hora);
        const esPasada = fechaReserva < hoy;
        
        const fechaFormateada = new Date(reserva.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const horaFormateada = reserva.hora.substring(0, 5);

        html += `
            <div class="reserva-card ${esPasada ? 'reserva-pasada' : 'reserva-activa'}">
                <div class="reserva-header">
                    <span class="reserva-fecha">📅 ${fechaFormateada}</span>
                    <span class="reserva-hora">🕐 ${horaFormateada}</span>
                    <span class="reserva-estado ${esPasada ? 'estado-pasado' : 'estado-activo'}">
                        ${esPasada ? '✅ Completada' : '🟢 Activa'}
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
                    </span>
                </div>
                <div class="reserva-body">
                    <p><strong>👤 ${reserva.nombre}</strong></p>
                    <p>📧 ${reserva.email}</p>
                    <p>📞 ${reserva.telefono}</p>
                    <p>🪑 ${reserva.sillas} sillas</p>
<<<<<<< HEAD
                    ${
                      reserva.descripcion &&
                      reserva.descripcion !== "Sin comentarios"
                        ? `<p class="reserva-desc">💬 ${reserva.descripcion}</p>`
                        : ""
                    }
                </div>
                ${
                  !esPasada
                    ? `
=======
                    ${reserva.descripcion && reserva.descripcion !== 'Sin comentarios' ? 
                        `<p class="reserva-desc">💬 ${reserva.descripcion}</p>` : ''}
                </div>
                ${!esPasada ? `
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
                    <div class="reserva-footer">
                        <button class="btn-cancelar-reserva" data-index="${index}" style="background: #ff3333; color: #fff; padding: 8px 18px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
                            Cancelar Reserva
                        </button>
                    </div>
<<<<<<< HEAD
                `
                    : ""
                }
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;

  document.querySelectorAll(".btn-cancelar-reserva").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = parseInt(this.dataset.index);
      cancelarReserva(index);
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  renderizarReservas();

  window.addEventListener("storage", function (e) {
    if (e.key === "la_fonda_user" || e.key === "la_fonda_reservas") {
      renderizarReservas();
    }
  });
});
=======
                ` : ''}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Eventos para botones de cancelar
    document.querySelectorAll('.btn-cancelar-reserva').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            cancelarReserva(index);
        });
    });
}

// ============================================================ //
// INICIALIZACIÓN
// ============================================================ //

document.addEventListener('DOMContentLoaded', function() {
    renderizarReservas();

    window.addEventListener('storage', function(e) {
        if (e.key === 'sabor_estilo_user' || e.key === 'sabor_estilo_reservas') {
            renderizarReservas();
        }
    });
});
>>>>>>> c8b62a804c19c83f54665f6bc11a424065d038ce
