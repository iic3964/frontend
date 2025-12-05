import { useState } from "react";
import { apiClient } from "../../modules/api";

export default function SupervisorActionCard({ 
  clinicalAttention, 
  userRole, 
  onUpdate 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState(null); // "reject" | "ratify"

  // LOGIC: Visible to Supervisor and Admin.
  if (userRole !== "supervisor" && userRole !== "admin") return null;

  // Check if episode is closed
  const isClosed = clinicalAttention.is_closed === true;

  const status = clinicalAttention.supervisor_approved; // true (ratified), false (objected), null (no action)
  const observation = clinicalAttention.supervisor_observation;

  const handleSubmit = async () => {
    if (actionType === "reject" && reason.trim().length < 5) {
      setError("Debes indicar una observación detallada para objetar el caso.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        supervisor_approved: actionType === "ratify" ? true : false,
        supervisor_observation: reason
      };

      const response = await apiClient.updateClinicalAttention(
        clinicalAttention.id,
        payload
      );

      if (response.success) {
        setIsEditing(false);
        if (onUpdate) onUpdate();
      } else {
        setError(response.error || "Error al actualizar el estado");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERS ---

  // Modo Edición (Formulario)
  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm mt-6 animate-in fade-in zoom-in duration-200">
        <h3 className={`text-lg font-bold mb-2 ${actionType === 'reject' ? 'text-red-600' : 'text-purple-700'}`}>
          {actionType === 'reject' ? 'Objetar Caso Clínico' : 'Ratificar Caso (Opcional)'}
        </h3>
        
        <p className="text-sm text-health-text-muted mb-4">
          {actionType === 'reject' 
            ? "Indica las razones por las cuales el criterio clínico aplicado no es correcto o requiere corrección."
            : "Estás dejando una marca explícita de que este caso ha sido revisado y aprobado por la supervisión."}
        </p>

        <div className="mb-4">
          <label className="text-xs font-semibold text-health-text-muted uppercase">Observación / Razón</label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mt-1 p-3 border border-health-border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-health-text"
            rows={3}
            placeholder={actionType === 'reject' ? "Ej: El paciente presenta antecedentes que sugieren..." : "Comentario opcional..."}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-health-text-muted hover:text-health-text text-sm font-medium transition cursor-pointer"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-md transition cursor-pointer flex items-center gap-2
              ${actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}
              ${loading ? 'opacity-70 cursor-not-allowed' : ''}
            `}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    );
  }

  // Modo Visualización (Estado Actual)
  return (
    <div className="bg-white rounded-xl border border-health-border p-6 shadow-sm mt-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-health-text mb-1">
            Revisión del Supervisor
          </h3>
          <p className="text-sm text-health-text-muted">
            Gestión por excepción. Si el caso está correcto, no se requiere acción.
          </p>
        </div>
        
        {/* Actions for Supervisor */}
        {!isClosed && (
          <div className="flex gap-2">
             {/* Botón Ratificar: Siempre visible para permitir cambiar decisión o editar */}
             <button
              onClick={() => {
                setActionType("ratify");
                setReason(status === true ? (observation || "") : "");
                setIsEditing(true);
              }}
              className="text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 px-3 py-1.5 rounded-lg border border-transparent hover:border-purple-100 transition cursor-pointer"
            >
              {status === true
                ? "Editar Ratificación"
                : status === false
                  ? "Cambiar a Ratificar"
                  : "Ratificar (Opcional)"}
            </button>

             {/* Botón Objetar: Siempre visible para permitir cambiar decisión o editar */}
             <button
               onClick={() => {
                 setActionType("reject");
                 setReason(status === false ? (observation || "") : "");
                 setIsEditing(true);
               }}
               className="text-xs font-medium bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-200 transition cursor-pointer"
             >
               {status === false
                 ? "Editar Objeción"
                 : status === true
                   ? "Cambiar a Objetar"
                   : "Objetar Caso"}
             </button>
          </div>
        )}
      </div>

      {/* Closed Episode Indicator */}
      {isClosed && (
        <div className="mb-4 p-3 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Episodio cerrado - No se pueden realizar cambios</span>
        </div>
      )}

      {/* Estado Actual */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        {status === null ? (
          <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Sin observaciones (Aprobación tácita)</span>
          </div>
        ) : status === false ? (
          <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">Caso Objetado</span>
            </div>
            <p className="text-sm text-red-600 mt-1 pl-7">
              "{observation}"
            </p>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Ratificado explícitamente por Supervisor</span>
            </div>
            {observation && (
                <p className="text-sm text-purple-600 mt-2 pl-7 italic">
                    "{observation}"
                </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}