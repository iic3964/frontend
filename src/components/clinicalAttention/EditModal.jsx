import { useState } from "react";
import { apiClient } from "../../modules/api";

export default function EditModal({
  isOpen,
  onClose,
  clinicalAttention,
  onSuccess,
}) {
  const [diagnostic, setDiagnostic] = useState(
    clinicalAttention?.diagnostic || ""
  );
  // Manejamos null, true, false
  const [urgencyLaw, setUrgencyLaw] = useState(
    clinicalAttention?.applies_urgency_law
  ); 
  const [reason, setReason] = useState(
    clinicalAttention?.overwritten_reason || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Enviamos diagnóstico, ley de urgencia y razón
      const response = await apiClient.updateClinicalAttention(
        clinicalAttention.id,
        { 
          diagnostic,
          applies_urgency_law: urgencyLaw,
          overwritten_reason: reason 
        }
      );

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error || "Error al actualizar");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0A0A0A] rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-semibold text-white">Editar Atención Clínica</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          
          {/* Sección 1: Diagnóstico */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Diagnóstico Médico
            </label>
            <textarea
              value={diagnostic}
              onChange={(e) => setDiagnostic(e.target.value)}
              rows={5}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-health-accent resize-none placeholder:text-white/20"
              placeholder="Describa el diagnóstico..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Sección 2: Ley de Urgencia (Selector visual) */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                ¿Aplica Ley de Urgencia?
              </label>
              <div className="flex gap-2">
                {[
                  { label: "Sí", value: true, activeClass: "bg-health-ok/20 text-health-ok border-health-ok/50" },
                  { label: "No", value: false, activeClass: "bg-red-500/20 text-red-400 border-red-500/50" },
                  { label: "Pendiente", value: null, activeClass: "bg-white/10 text-white border-white/30" }
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setUrgencyLaw(option.value)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      urgencyLaw === option.value
                        ? option.activeClass + " ring-1 ring-offset-1 ring-offset-black ring-white/20"
                        : "bg-transparent border-white/10 text-white/40 hover:bg-white/5"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sección 3: Razón de cambio / Sobrescritura */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Motivo de edición / Sobrescritura
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-health-accent resize-none placeholder:text-white/20"
                placeholder="Opcional: ¿Por qué se modificó esta atención?"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-health-accent text-black text-sm font-bold hover:bg-health-accent-dark transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}