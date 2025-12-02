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
    Temperatura: "N/A",
    "Presión Arterial": "N/A",
    "Frecuencia Cardíaca": "N/A",
    "Frecuencia Respiratoria": "N/A",
    "Saturación O2": "N/A",
    Glasgow: "N/A",
    "Dolor (0-10)": "N/A",
    "Glicemia Capilar": "N/A",
  });
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [triage, setTriage] = useState("");

  const [hallazgos, setHallazgos] = useState("");
  const [diagnostico, setDiagnostico] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [idEpisode, setIdEpisode] = useState("");

  // -----------------------------
  // Parse clinical summary
  // -----------------------------
  useEffect(() => {
    if (!clinicalAttention) return;
      setIdEpisode(clinicalAttention.id_episodio || "");

    if (!clinicalAttention.diagnostic) {
      setAnamnesis("");
      setHallazgos("");
      setDiagnostico("");
      return;
    }

    const txt = clinicalAttention.diagnostic;
    // Intentamos parsear si tiene formato estructurado
    if (txt.includes("=====")) {
      const raw = txt
        .split("=====")
        .map((s) => s.trim())
        .filter(Boolean);

      const getSection = (name) => {
        const idx = raw.findIndex(
          (r) => r.toLowerCase() === name.toLowerCase()
        );
        return idx !== -1 ? raw[idx + 1] : "";
      };

      setAnamnesis(getSection("ANAMNESIS"));
      setHallazgos(getSection("HALLAZGOS CLÍNICOS"));
      setDiagnostico(getSection("DIAGNÓSTICO PRESUNTIVO"));
      setMotivoConsulta(getSection("MOTIVO DE CONSULTA"));
      setTriage(getSection("TRIAGE"));

      // signos vitales
      const vitals = getSection("SIGNOS VITALES");
      if (vitals) {
        const updated = {};
        vitals.split("\n").forEach((l) => {
          if (l.includes(":")) {
            const [k, v] = l.split(":").map((x) => x.trim());
            updated[k] = v;
          }
        });
        setSignos((prev) => ({ ...prev, ...updated }));
      }
    } else {
      setDiagnostico(txt);
    }
  }, [clinicalAttention, isOpen]); // Added isOpen to ensure reset when reopening

  // -----------------------------
  // Build summary TXT
  // -----------------------------
  // Usamos useCallback o simplemente una función pura para evitar problemas de dependencias,
  // pero dado que se usa en render y submit, la dejamos como función simple.
  const buildTxt = () => {
  const signosTxt = Object.entries(signos)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  return `===== TRIAGE =====
${triage}

===== MOTIVO DE CONSULTA =====
${motivoConsulta}

===== ANAMNESIS =====
${anamnesis}

===== SIGNOS VITALES =====
${signosTxt}

===== HALLAZGOS CLÍNICOS =====
${hallazgos}

===== DIAGNÓSTICO PRESUNTIVO =====
${diagnostico}
`;
};


  // -----------------------------
  // DIRTY CHECK (Validar cambios)
  // -----------------------------
  const hasChanges = () => {
    if (!clinicalAttention) return false;
    const originalUrgency = clinicalAttention.applies_urgency_law;

    const currentTxt = buildTxt().trim();
    const originalTxt = (clinicalAttention.diagnostic || "").trim();

    return currentTxt !== originalTxt || idEpisode !== (clinicalAttention.id_episodio || "");
  };

  const isDirty = hasChanges();

  // -----------------------------
  // Submit
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isDirty) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    const newTxt = buildTxt();

    try {
      const response = await apiClient.updateClinicalAttention(
        clinicalAttention.id,
        {
          diagnostic: newTxt,
          clinical_summary_txt: newTxt,
          id_episodio: idEpisode
        }
      );

      if (response.success) {
        onSuccess();
      } else {
        setError(response.error || "Error al actualizar");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-[#0A0A0A] rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-semibold text-white tracking-wide">
            Editar Atención Clínica
          </h2>

          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* ID EPISODIO */}
<div>
  <label className="block text-sm font-medium text-white/70 mb-2">
    ID Episodio
  </label>
  <input
    value={idEpisode}
    onChange={(e) => setIdEpisode(e.target.value)}
    className="w-full bg-[#0f1220] border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-inner"
  />
  <p className="text-xs text-white/40 mt-1">
  </p>
</div>
{/* MOTIVO DE CONSULTA */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Motivo de Consulta
          </label>
          <textarea
            value={motivoConsulta}
            onChange={(e) => setMotivoConsulta(e.target.value)}
            rows={2}
            className="w-full bg-[#0f1220] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-inner"
          />
        </div>
        {/* TRIAGE */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Triage (1 = más grave)
          </label>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTriage(String(n))}
                className={`
                  px-4 py-2 rounded-lg border transition font-semibold 
                  ${
                    triage === String(n)
                      ? "bg-health-accent text-black border-health-accent-dark"
                      : "bg-[#0f1220] text-white/70 border-white/10 hover:bg-white/10"
                  }
                `}
              >
                {n}
              </button>
            ))}
          </div>
        </div>


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

          <hr className="border-white/10" />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !isDirty}
              className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition
                ${
                  !isDirty
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-health-accent text-black hover:bg-health-accent-dark cursor-pointer"
                }
              `}
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
