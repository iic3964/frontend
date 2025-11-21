import { useState } from "react";
import { apiClient } from "../modules/api"; // Make sure this path is correct

/** @param {{ mode: "login" | "register" }} props */
export default function AuthForm({ mode }) {
  const [form, setForm] = useState({
    first: "",
    last: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
        });
      } else {
        response = await apiClient.login({
          email: form.email,
          password: form.password,
        });
      }

      if (!response.success) {
        // Error is now handled by the apiClient, including 'detail'
        throw new Error(response.error || "Ocurrió un error");
      }

      // Handle successful response
      const data = response.data;

      if (mode === "register") {
        alert("Registro exitoso ✅ Revisa tu correo para confirmar la cuenta.");
        window.location.href = "/auth/login";
      }

      if (mode === "login") {
        if (!data || !data.session) {
          throw new Error(
            "Respuesta de login inválida. No se encontró la sesión."
          );
        }

        // Store the session returned from the backend
        localStorage.setItem("saluia.session", JSON.stringify(data.session));

        // Use user data from the session
        const user = data.session?.user;
        const userName =
          user?.user_metadata?.first_name || user?.email || "Usuario";

        alert(`Bienvenido/a ${userName} 👋`);
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
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

  return (
    <div className="w-full max-w-sm rounded-2xl bg-health-card border border-white/10 p-8 space-y-6 shadow-xl">
      <h2 className="text-2xl font-semibold text-center mb-2">{title}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <input
              name="first"
              placeholder="Nombre"
              value={form.first}
              onChange={handleChange}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
              required
            />
            <input
              name="last"
              placeholder="Apellido"
              value={form.last}
              onChange={handleChange}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
              required
            />
          </>
        )}

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
          required
          minLength={6}
        />

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-health-accent text-black py-2 font-medium hover:bg-health-accent-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Cargando..."
            : mode === "login"
            ? "Entrar"
            : "Registrarse"}
        </button>
      </form>

      <p className="text-sm text-center text-white/60 pt-2">
        {opposite.text}{" "}
        <a href={opposite.link} className="text-health-accent hover:underline">
          {opposite.label}
        </a>
      </p>
    </div>
  );
}
