document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const status = document.getElementById("register-status");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const nombre = document.getElementById("reg-nombre").value.trim();
        const apellido = document.getElementById("reg-apellido").value.trim();
        const email = document.getElementById("reg-email").value.trim().toLowerCase();
        const telefono = document.getElementById("reg-telefono").value.trim();
        const password = document.getElementById("reg-password").value;
        const password2 = document.getElementById("reg-password2").value;
        if (!nombre || !apellido) return show("Completa nombre y apellido.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return show("Ingresa un correo válido.");
        if (password.length < 6) return show("La contraseña debe tener al menos 6 caracteres.");
        if (password !== password2) return show("Las contraseñas no coinciden.");
        const button = form.querySelector("button[type=submit]");
        button.disabled = true;
        button.textContent = "Creando cuenta...";
        try {
            await LaFondaAuth.register({ nombre, apellido, email, telefono, password });
            status.style.color = "#7bd88f";
            status.textContent = "Cuenta creada. Ingresando...";
            setTimeout(() => { window.location.href = "/index.html"; }, 500);
        } catch (error) {
            show(error.message);
        } finally {
            button.disabled = false;
            button.textContent = "Crear Cuenta";
        }
    });
    function show(message) {
        status.style.color = "#ff6b6b";
        status.textContent = message;
    }
});
