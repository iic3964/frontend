import { useState } from "react";
import { apiClient } from "../../modules/api";

export default function ResidentApprovalCard({ 
  clinicalAttention, 
  userRole, 
  onUpdate 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // LOGIC: Visible to Residents and Admins. Hidden for Supervisors.
  if (userRole !== "resident" && userRole !== "admin") return null;

  // Extract status
  const isApproved = clinicalAttention.medic_approved === true;
  const isRejected = clinicalAttention.medic_approved === false;
  const isPending = clinicalAttention.medic_approved === null;

  const handleApproval = async (approved) => {


    setLoading(true);
    setError(null);

    try {
      const session = JSON.parse(localStorage.getItem("saluia.session") || "{}");
      const medicId = session.user?.id; 

      if (!medicId) {
        setError("Error: No se pudo identificar al usuario.");
        return;
      }

      const response = await apiClient.AproveClinicalAttention(
        clinicalAttention.id,
        approved,
        approved ? "Aprobado por médico residente" : "Rechazado por médico residente",
        medicId
      );

      if (response.success) {
        if (onUpdate) onUpdate();
      } else {
        setError(response.error || "Error al actualizar validación");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-health-border p-6 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-health-text mb-2">
        Aprobación del Médico Residente
      </h3>
      
      <p className="text-sm text-health-text-muted mb-4">
        Esta es la <strong>Primera Validación Humana</strong>. Como médico residente, 
        debes confirmar si el análisis de la IA es correcto o rechazarlo si difiere 
        de tu criterio clínico.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {isPending ? (
        <div className="flex gap-4">
          <button
            onClick={() => handleApproval(true)}
            disabled={loading}
            className="flex-1 bg-green-50 text-green-700 border border-green-200 py-2 px-4 rounded-lg hover:bg-green-100 font-medium transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Procesando..." : "Aprobar resultado IA"}
          </button>
          
          <button
            onClick={() => handleApproval(false)}
            disabled={loading}
            className="flex-1 bg-red-50 text-red-700 border border-red-200 py-2 px-4 rounded-lg hover:bg-red-100 font-medium transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Procesando..." : "Rechazar resultado IA"}
          </button>
        </div>
      ) : (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${
          isApproved 
            ? "bg-green-50 border-green-200" 
            : "bg-red-50 border-red-200"
        }`}>
          {isApproved ? (
            <div className="text-green-600 bg-green-100 p-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
             <div className="text-red-600 bg-red-100 p-1 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
               </svg>
             </div>
          )}
          
          <div>
            <p className={`font-semibold ${isApproved ? "text-green-800" : "text-red-800"}`}>
               {isApproved ? "Resultado Validado" : "Resultado Rechazado"}
            </p>
            <p className={`text-xs ${isApproved ? "text-green-600" : "text-red-600"}`}>
              {isApproved 
                ? "El médico residente ha confirmado el análisis de la IA." 
                : "El médico residente ha objetado el análisis de la IA."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}