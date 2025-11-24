import { useState } from "react";
import { apiClient } from "../modules/api";

/** @param {{ mode: "login" | "register" }} props */
export default function AuthForm({ mode }) {
  const [form, setForm] = useState({
    first: "",
    last: "",
    email: "",
    password: "",
    role: "resident", // Default role
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let response;

    try {
      if (mode === "register") {
        response = await apiClient.register({
          first: form.first,
          last: form.last,
          email: form.email,
          password: form.password,
          role: form.role, // Send role
        });
      } else {
        response = await apiClient.login({
          email: form.email,
          password: form.password,
        });
      }

      if (!response.success) {
        throw new Error(response.error || "Ocurrió un error");
      }

      const data = response.data;

      setSuccess(true);

      if (mode === "register") {
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
      }

      if (mode === "login") {
        if (!data || !data.session) {
          throw new Error("Invalid session data.");
        }
        localStorage.setItem("saluia.session", JSON.stringify(data.session));
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Iniciar sesión" : "Crear cuenta nueva";
  const opposite =
    mode === "login"
      ? {
          text: "¿No tienes cuenta?",
          link: "/auth/register",
          label: "Regístrate",
        }
      : {
          text: "¿Ya tienes cuenta?",
          link: "/auth/login",
          label: "Inicia sesión",
        };

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-health-card border border-white/10 p-8 shadow-xl flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-health-accent/20 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-health-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-center mb-2">
          {mode === "login" ? "¡Bienvenido/a!" : "¡Cuenta creada!"}
        </h2>
        <p className="text-white/60 text-center">
          {mode === "login"
            ? "Redirigiendo al dashboard..."
            : "Redirigiendo al inicio de sesión..."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-health-card border border-white/10 p-8 space-y-6 shadow-xl">
      <div className="flex items-center justify-center gap-3 pb-2">
        <img src="/health.svg" alt="SaluIA Logo" className="w-10 h-10" />
        <h1 className="text-3xl font-bold tracking-tight text-white">SaluIA</h1>
      </div>

      <h2 className="text-xl font-medium text-center text-white/80">
        {title}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <input
                name="first"
                placeholder="Nombre"
                value={form.first}
                onChange={handleChange}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent placeholder:text-white/30 transition-all"
                required
              />
              <input
                name="last"
                placeholder="Apellido"
                value={form.last}
                onChange={handleChange}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent placeholder:text-white/30 transition-all"
                required
              />
            </div>

            {/* Role Selector */}
            <div className="relative">
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent text-white appearance-none cursor-pointer"
                required
              >
                <option value="resident">Médico Residente</option>
                <option value="supervisor">Médico Jefe</option>
              </select>
              {/* Custom Arrow Icon for Select */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/50">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </>
        )}

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent placeholder:text-white/30 transition-all"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent placeholder:text-white/30 transition-all"
          required
          minLength={6}
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-health-accent text-black py-2 font-medium hover:bg-health-accent-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Registrarse"}
        </button>
      </form>

      <p className="text-sm text-center text-white/60 pt-2">
        {opposite.text}{" "}
        <a
          href={opposite.link}
          className="text-health-accent hover:underline decoration-health-accent/50 underline-offset-4"
        >
          {opposite.label}
        </a>
      </p>
    </div>
  );
}