import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";

export default function EditInsuranceCompanyModal({
  isOpen,
  onClose,
  company,
  onSuccess,
}) {
  const [nombreComercial, setNombreComercial] = useState("");
  const [nombreJuridico, setNombreJuridico] = useState("");
  const [rut, setRut] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setNombreComercial(company.nombre_comercial || "");
      setNombreJuridico(company.nombre_juridico || "");
      setRut(company.rut || "");
    }
  }, [company]);

  const handleSave = async () => {
    if (!nombreJuridico.trim()) {
      alert("El nombre jurídico es obligatorio.");
      return;
    }

    setLoading(true);

    const resp = await apiClient.updateInsuranceCompany(company.id, {
      nombre_comercial: nombreComercial,
      nombre_juridico: nombreJuridico,
      rut,
    });

    setLoading(false);

    if (resp.success) {
      onSuccess();
      onClose();
    } else {
      alert("Error al actualizar: " + resp.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* HEADER */}
        <h2 className="text-xl font-semibold text-health-accent mb-4">
          Editar Aseguradora
        </h2>

        {/* FORM */}
        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-sm">Nombre Comercial</label>
            <input
              className="w-full mt-1 bg-black/20 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
              value={nombreComercial}
              onChange={(e) => setNombreComercial(e.target.value)}
            />
          </div>

          <div>
            <label className="text-white/60 text-sm">Razón Social *</label>
            <input
              className="w-full mt-1 bg-black/20 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
              value={nombreJuridico}
              onChange={(e) => setNombreJuridico(e.target.value)}
            />
          </div>

          <div>
            <label className="text-white/60 text-sm">RUT</label>
            <input
              className="w-full mt-1 bg-black/20 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-health-accent text-black font-medium hover:bg-health-accent-dark transition shadow-lg shadow-health-accent/10 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
