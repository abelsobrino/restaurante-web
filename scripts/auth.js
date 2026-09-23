(function () {
  const SESSION_KEY = "lafonda_web_session";
  const LEGACY_KEY = "la_fonda_user";

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function writeSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        nombre: session.nombre || session.email?.split("@")[0] || "Usuario",
        email: session.email,
        rol: session.rol,
        loginTime: new Date().toISOString(),
      }),
    );
    window.dispatchEvent(
      new CustomEvent("lafonda-session-change", { detail: session }),
    );
    return session;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_KEY);
    window.dispatchEvent(
      new CustomEvent("lafonda-session-change", { detail: null }),
    );
  }

  async function login(email, password) {
    const result = await window.LaFondaDB.rpc("web_login", {
      p_email: email,
      p_password: password,
    });
    if (!result?.ok)
      throw new Error(result?.mensaje || "No se pudo iniciar sesión");
    return writeSession({
      id: result.id,
      nombre: result.nombre,
      apellido: result.apellido || "",
      email: result.email,
      telefono: result.telefono || "",
      rol: result.rol,
      modo: result.rol === "ADMIN" ? null : "CLIENTE",
      password,
    });
  }

  async function register({ nombre, apellido, email, telefono, password }) {
    const result = await window.LaFondaDB.rpc("web_registrar_cliente", {
      p_nombre: nombre,
      p_apellido: apellido,
      p_email: email,
      p_telefono: telefono || "",
      p_password: password,
    });
    if (!result?.ok)
      throw new Error(result?.mensaje || "No se pudo crear la cuenta");
    return login(email, password);
  }

  function setMode(mode) {
    const session = getSession();
    if (!session || session.rol !== "ADMIN") return null;
    session.modo = mode === "ADMIN" ? "ADMIN" : "CLIENTE";
    return writeSession(session);
  }

  function isAdmin() {
    return getSession()?.rol === "ADMIN";
  }

  function isClient() {
    return getSession()?.rol === "CLIENTE";
  }

  function credentials(role = null) {
    const s = getSession();
    if (!s) throw new Error("Inicia sesión para continuar");
    if (role && s.rol !== role)
      throw new Error(
        role === "ADMIN"
          ? "Acceso exclusivo para administrador"
          : "Inicia sesión con una cuenta de cliente",
      );
    return { email: s.email, password: s.password };
  }

  function requireLogin(returnTo = window.location.pathname) {
    if (getSession()) return true;
    sessionStorage.setItem("lafonda_return_to", returnTo);
    window.location.href = "/src/modulo_auth/registrarse.html";
    return false;
  }

  function logout() {
    clearSession();
    window.location.href = "/index.html";
  }

  window.LaFondaAuth = {
    getSession,
    login,
    register,
    setMode,
    isAdmin,
    isClient,
    credentials,
    requireLogin,
    logout,
    clearSession,
  };
})();
