document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    const status = document.getElementById("login-status");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            status.textContent = "Ingresa un correo válido.";
            status.style.color = "#ff6b6b";
            return;
        }
        if (password.length < 6) {
            status.textContent = "La contraseña debe tener al menos 6 caracteres.";
            status.style.color = "#ff6b6b";
            return;
        }

        const button = form.querySelector("button[type=submit]");
        button.disabled = true;
        button.textContent = "Validando...";
        status.textContent = "Consultando la base de datos...";
        status.style.color = "var(--text-gray)";
        try {
            const session = await LaFondaAuth.login(email, password);
            if (session.rol === "ADMIN") {
                window.location.href = "/src/modulo_auth/elegir-modo.html";
                return;
            }
            const returnTo = sessionStorage.getItem("lafonda_return_to");
            sessionStorage.removeItem("lafonda_return_to");
            window.location.href = returnTo && !returnTo.includes("registrarse") ? returnTo : "/index.html";
        } catch (error) {
            status.textContent = error.message;
            status.style.color = "#ff6b6b";
        } finally {
            button.disabled = false;
            button.textContent = "Iniciar Sesión";
        }
    });
});
