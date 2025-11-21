import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";

export default function EditModal({
  isOpen,
  onClose,
  clinicalAttention,
  onSuccess,
}) {
  const [anamnesis, setAnamnesis] = useState("");
  const [signos, setSignos] = useState({
    "Temperatura": "36.5°C",
    "Presión Arterial": "120/80",
    "Frecuencia Cardíaca": "75",
    "Frecuencia Respiratoria": "16",
    "Saturación O2": "98%",
    "Glasgow": "15",
    "Dolor (0-10)": "0",
    "Glicemia Capilar": "90",
  });
  const [hallazgos, setHallazgos] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // -----------------------------
  // Parse clinical summary
  // -----------------------------
  useEffect(() => {
    if (!clinicalAttention?.diagnostic) return;

    const txt = clinicalAttention.diagnostic;
    const raw = txt.split("=====").map((s) => s.trim()).filter(Boolean);

    const getSection = (name) => {
      const idx = raw.findIndex((r) => r.toLowerCase() === name.toLowerCase());
      return idx !== -1 ? raw[idx + 1] : "";
    };

    setAnamnesis(getSection("ANAMNESIS"));
    setHallazgos(getSection("HALLAZGOS CLÍNICOS"));
    setDiagnostico(getSection("DIAGNÓSTICO PRESUNTIVO"));

    // signos vitales
    const vitals = getSection("SIGNOS VITALES");
    const updated = {};

    vitals.split("\n").forEach((l) => {
      if (l.includes(":")) {
        const [k, v] = l.split(":").map((x) => x.trim());
        updated[k] = v;
      }
    });

    setSignos((prev) => ({ ...prev, ...updated }));
  }, [clinicalAttention]);

  // -----------------------------
  // Build summary TXT
  // -----------------------------
  const buildTxt = () => {
    const signosTxt = Object.entries(signos)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    return (
`===== ANAMNESIS =====
${anamnesis}

===== SIGNOS VITALES =====
${signosTxt}

===== HALLAZGOS CLÍNICOS =====
${hallazgos}

===== DIAGNÓSTICO PRESUNTIVO =====
${diagnostico}
`
    );
  };

  // -----------------------------
  // Submit
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage("");

    const newTxt = buildTxt();

    try {
      const response = await apiClient.updateClinicalAttention(
        clinicalAttention.id,
        { diagnostic: newTxt, clinical_summary_txt: newTxt }
      );

      if (response.success) {
        setSuccessMessage("Atención clínica actualizada exitosamente");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setError(response.error || "Error al actualizar la atención clínica");
      }
    } catch {
      setError("Error al actualizar la atención clínica");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // -----------------------------
  // Render
  // -----------------------------
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="bg-[#151929] rounded-xl p-6 w-full max-w-2xl mx-4 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">

        <h2 className="text-2xl font-semibold mb-5 text-white tracking-wide">
          Editar Atención Clínica
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ANAMNESIS */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Anamnesis
            </label>
            <textarea
              value={anamnesis}
              onChange={(e) => setAnamnesis(e.target.value)}
              rows={3}
              className="w-full bg-[#0f1220] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-inner"
            />
          </div>

          {/* SIGNOS VITALES GRID */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              Signos Vitales
            </label>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(signos).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-xs text-white/50 mb-1">{k}</span>
                  <input
                    value={v}
                    onChange={(e) =>
                      setSignos({ ...signos, [k]: e.target.value })
                    }
                    className="bg-[#0f1220] border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-inner"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* HALLAZGOS */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Hallazgos Clínicos
            </label>
            <textarea
              value={hallazgos}
              onChange={(e) => setHallazgos(e.target.value)}
              rows={3}
              className="w-full bg-[#0f1220] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-inner"
            />
          </div>

          {/* DIAGNÓSTICO */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Diagnóstico Presuntivo
            </label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              rows={3}
              className="w-full bg-[#0f1220] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-inner"
            />
          </div>

          {/* MENSAJES */}
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-health-ok text-sm bg-health-ok/10 border border-health-ok/20 rounded-lg px-3 py-2">
              {successMessage}
            </div>
          )}

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/10 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-health-accent text-black font-medium hover:bg-health-accent-dark transition disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
