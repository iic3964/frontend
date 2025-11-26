import { useState } from "react";
import { apiClient } from "../../modules/api";

export default function CreateInsuranceCompany() {
  const [nombreComercial, setNombreComercial] = useState("");
  const [nombreJuridico, setNombreJuridico] = useState("");
  const [rut, setRut] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombreJuridico.trim()) {
      alert("El nombre jurídico es obligatorio.");
      return;
    }

    setLoading(true);

    const payload = {
      nombre_comercial: nombreComercial || null,
      nombre_juridico: nombreJuridico,
      rut: rut || null,
    };

    const resp = await apiClient.createInsuranceCompany(payload);

    setLoading(false);

    if (resp.success) {
      window.location.href = "/aseguradora";
    } else {
      alert("Error al crear aseguradora: " + resp.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* VOLVER */}
      <a
        href="/aseguradora"
        className="text-health-accent hover:underline text-sm inline-flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Volver
      </a>

      {/* TÍTULO */}
      <h2 className="text-xl font-semibold text-health-accent">
        Registrar nueva aseguradora
      </h2>

      {/* FORMULARIO */}
      <div className="space-y-4">
        {/* Nombre Comercial */}
        <div>
          <label className="text-white/60 text-sm">Nombre Comercial</label>
          <input
            type="text"
            value={nombreComercial}
            onChange={(e) => setNombreComercial(e.target.value)}
            className="w-full mt-1 bg-black/20 border border-white/10 text-white rounded-lg 
                       px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
          />
        </div>

        {/* Nombre Jurídico */}
        <div>
          <label className="text-white/60 text-sm">
            Razón Social <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={nombreJuridico}
            onChange={(e) => setNombreJuridico(e.target.value)}
            className="w-full mt-1 bg-black/20 border border-white/10 text-white rounded-lg 
                       px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
          />
        </div>

        {/* RUT */}
        <div>
          <label className="text-white/60 text-sm">RUT</label>
          <input
            type="text"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="w-full mt-1 bg-black/20 border border-white/10 text-white rounded-lg 
                       px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
          />
        </div>
      </div>

      {/* BOTONES */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-health-accent text-black rounded-lg font-medium
                     hover:bg-health-accent-dark transition shadow-lg shadow-health-accent/10
                     disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Aseguradora"}
        </button>
      </div>
    </form>
  );
}
