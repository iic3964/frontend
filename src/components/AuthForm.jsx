import { useState } from "react";

/** @param {{ mode: "login" | "register" }} props */
export default function AuthForm({ mode }) {
  const [form, setForm] = useState({
    first: "",
    last: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === "register") {
      localStorage.setItem(
        "saluia.user",
        JSON.stringify({
          first: form.first,
          last: form.last,
          email: form.email,
        })
      );
      alert("Registro exitoso ✅ Redirigiendo a login...");
      window.location.href = "/auth/login";
      return;
    }

    if (mode === "login") {
      const user = JSON.parse(localStorage.getItem("saluia.user")) || {
        email: form.email,
        first: "Usuario",
        last: "",
      };

      localStorage.setItem("saluia.session", JSON.stringify(user));
      alert(`Bienvenido/a ${user.first || "Usuario"} 👋`);
      window.location.href = "/"; 
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
        />

        <button
          type="submit"
          className="w-full rounded-xl bg-health-accent text-black py-2 font-medium hover:bg-health-accent-dark transition"
        >
          {mode === "login" ? "Entrar" : "Registrarse"}
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
