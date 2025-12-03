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
    // Attempt parsing if structured
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

      // Vital signs
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
  }, [clinicalAttention, isOpen]);

  // -----------------------------
  // Build summary TXT
  // -----------------------------
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
  // DIRTY CHECK
  // -----------------------------
  const hasChanges = () => {
    if (!clinicalAttention) return false;

    const currentTxt = buildTxt().trim();
    const originalTxt = (clinicalAttention.diagnostic || "").trim();

    return (
      currentTxt !== originalTxt ||
      idEpisode !== (clinicalAttention.id_episodio || "")
    );
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
          id_episodio: idEpisode,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-health-card rounded-2xl border border-health-border w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-health-border flex justify-between items-center bg-health-bg/50">
          <h2 className="text-lg font-semibold text-health-text tracking-wide">
            Editar Atención Clínica
          </h2>

          <button
            onClick={onClose}
            className="text-health-text-muted hover:text-health-text transition text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* ID EPISODIO */}
          <div>
            <label className="block text-sm font-medium text-health-text-muted mb-2">
              ID Episodio
            </label>
            <input
              value={idEpisode}
              onChange={(e) => setIdEpisode(e.target.value)}
              className="w-full bg-white border border-health-border rounded-lg px-4 py-2 text-health-text focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-sm"
            />
          </div>

          {/* MOTIVO DE CONSULTA */}
          <div>
            <label className="block text-sm font-medium text-health-text-muted mb-2">
              Motivo de Consulta
            </label>
            <textarea
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              rows={2}
              className="w-full bg-white border border-health-border rounded-lg px-4 py-3 text-health-text focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-sm"
            />
          </div>

          {/* TRIAGE */}
          <div>
            <label className="block text-sm font-medium text-health-text-muted mb-2">
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
                        ? "bg-health-accent text-white border-health-accent"
                        : "bg-white text-health-text-muted border-health-border hover:bg-health-bg"
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
            <label className="block text-sm font-medium text-health-text-muted mb-2">
              Anamnesis
            </label>
            <textarea
              value={anamnesis}
              onChange={(e) => setAnamnesis(e.target.value)}
              rows={3}
              className="w-full bg-white border border-health-border rounded-lg px-4 py-3 text-health-text focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-sm"
            />
          </div>

          {/* SIGNOS VITALES GRID */}
          <div>
            <label className="block text-sm font-medium text-health-text-muted mb-3">
              Signos Vitales
            </label>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(signos).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-xs text-health-text-muted/80 mb-1">
                    {k}
                  </span>
                  <input
                    value={v}
                    onChange={(e) =>
                      setSignos({ ...signos, [k]: e.target.value })
                    }
                    className="bg-white border border-health-border rounded-lg px-3 py-2 text-health-text focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* HALLAZGOS */}
          <div>
            <label className="block text-sm font-medium text-health-text-muted mb-2">
              Hallazgos Clínicos
            </label>
            <textarea
              value={hallazgos}
              onChange={(e) => setHallazgos(e.target.value)}
              rows={3}
              className="w-full bg-white border border-health-border rounded-lg px-4 py-3 text-health-text focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-sm"
            />
          </div>

          {/* DIAGNÓSTICO */}
          <div>
            <label className="block text-sm font-medium text-health-text-muted mb-2">
              Diagnóstico Presuntivo
            </label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              rows={3}
              className="w-full bg-white border border-health-border rounded-lg px-4 py-3 text-health-text focus:ring-2 focus:ring-health-accent outline-none transition-all shadow-sm"
            />
          </div>

          <hr className="border-health-border" />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-health-text-muted hover:text-health-text transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !isDirty}
              className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition
                ${
                  !isDirty
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-health-accent text-white hover:bg-health-accent-dark cursor-pointer shadow-md shadow-health-accent/20"
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