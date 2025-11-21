import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import DeleteModal from "./DeleteModal";
import EditModal from "./EditModal";

export default function ClinicalAttentionDetail() {
  const [clinicalAttention, setClinicalAttention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [polling, setPolling] = useState(false);

  const fetchData = async () => {
    const pathname = window.location.pathname;
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];

    if (!id || id === "details") {
      setError("No se encontró el ID de la atención clínica");
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.getClinicalAttention(id);

      if (response.success && response.data) {
        setClinicalAttention(response.data);

        // Activamos polling si la IA aún no responde
        if (response.data.ai_result === null) {
          setPolling(true);
        } else {
          setPolling(false);
        }
      } else {
        setError(response.error || "Error al cargar los datos");
      }
    } catch (err) {
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial
  useEffect(() => {
    fetchData();
  }, []);

  // Polling cada 5 segundos mientras la IA trabaja
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [polling]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleEditSuccess = () => {
    setLoading(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/70">Cargando...</div>
      </div>
    );
  }

  if (error || !clinicalAttention) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-red-400">{error || "No se encontraron datos"}</div>
        <a
          href="/clinical_attentions"
          className="text-health-accent hover:underline"
        >
          ← Volver a lista de atenciones
        </a>
      </div>
    );
  }

  const ca = clinicalAttention;
  const deletor = "392c3fe1-ee87-4bbb-ae46-d2733a84bf8f"; // TODO: get the user id

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <a
          href="/clinical_attentions"
          className="text-health-accent hover:underline text-sm inline-block"
        >
          ← Volver a lista de atenciones
        </a>

        <div className="flex gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-lg bg-health-accent text-black px-4 py-2 text-sm font-medium hover:bg-health-accent-dark transition"
          >
            Editar
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-medium hover:bg-red-600 transition"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4">Datos del Paciente</h2>
          <ul className="space-y-2 text-white/80">
            <li>
              <span className="text-white/50">Nombre:</span>{" "}
              {ca.patient.first_name} {ca.patient.last_name}
            </li>
            <li>
              <span className="text-white/50">RUT:</span> {ca.patient.rut}
            </li>
            <li>
              <span className="text-white/50">Email:</span>{" "}
              {ca.patient.email || "N/A"}
            </li>
            <li>
              <span className="text-white/50">Teléfono:</span>{" "}
              {ca.patient.phone || "N/A"}
            </li>
            <li>
              <span className="text-white/50">Dirección:</span>{" "}
              {ca.patient.address || "N/A"}
            </li>
            <li>
              <span className="text-white/50">Ciudad:</span>{" "}
              {ca.patient.city || "N/A"}
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4 mt-6">
            Información de la Atención
          </h2>
          <ul className="space-y-2 text-white/80">
            <li>
              <span className="text-white/50">Fecha de creación:</span>{" "}
              {formatDate(ca.created_at)}
            </li>
            <li>
              <span className="text-white/50">Última actualización:</span>{" "}
              {formatDate(ca.updated_at)}
            </li>
            <li>
              <span className="text-white/50">Diagnóstico:</span>{" "}
              {ca.diagnostic || "N/A"}
            </li>

            {/* LEY DE URGENCIA */}
            <li>
              <span className="text-white/50">Ley de Urgencia:</span>
              <span
                className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
                  ca.applies_urgency_law === true
                    ? "bg-health-ok/20 text-health-ok"
                    : ca.applies_urgency_law === false
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white/70"
                }`}
              >
                {ca.applies_urgency_law === true
                  ? "Sí"
                  : ca.applies_urgency_law === false
                  ? "No"
                  : "Pendiente"}
              </span>
            </li>

            {/* ESTADO IA */}
            <li>
              <span className="text-white/50">Resultado IA:</span>
              <span
                className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
                  ca.ai_result === true
                    ? "bg-health-ok/20 text-health-ok"
                    : ca.ai_result === false
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white/70"
                }`}
              >
                {ca.ai_result === true
                  ? "Aprobado"
                  : ca.ai_result === false
                  ? "Rechazado"
                  : "Pendiente"}
              </span>
            </li>

            {/* LOADER MIENTRAS IA PROCESA */}
            {ca.ai_result === null && (
              <li className="flex items-center gap-2 text-white/70 mt-2">
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                <span>Procesando diagnóstico con IA...</span>
              </li>
            )}

            {/* CONFIDENCE */}
            <li>
              <span className="text-white/50">Confianza IA:</span>{" "}
              {ca.ai_confidence !== null && ca.ai_confidence !== undefined  ? (
                <span
                  className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
                    ca.ai_confidence >= 0.8
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-300"
                  }`}
                >
                  {(ca.ai_confidence * 100).toFixed(0)}%
                </span>
              ) : (
                <span className="ml-2 text-white/40">N/A</span>
              )}
            </li>

            <li>
              <span className="text-white/50">Razón IA:</span>{" "}
              {ca.ai_reason || "N/A"}
            </li>

            {/* ESTADO */}
            <li>
              <span className="text-white/50">Estado:</span>
              {ca.is_deleted ? (
                <span className="ml-2 text-red-400">Eliminado</span>
              ) : (
                <span className="ml-2 text-health-ok">Activo</span>
              )}
            </li>

            <li>
              <span className="text-white/50">Sobrescrito por:</span>{" "}
              {ca.overwritten_by || "N/A"}
            </li>

            {ca.overwritten_reason && (
              <li>
                <span className="text-white/50">Razón de sobrescritura:</span>{" "}
                {ca.overwritten_reason}
              </li>
            )}
          </ul>
        </div>

        {/* MÉDICOS */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Médico Residente</h2>
          <ul className="space-y-2 text-white/80">
            <li>
              <span className="text-white/50">Nombre:</span>{" "}
              {ca.resident_doctor.first_name} {ca.resident_doctor.last_name}
            </li>
            <li>
              <span className="text-white/50">Email:</span>{" "}
              {ca.resident_doctor.email || "N/A"}
            </li>
            <li>
              <span className="text-white/50">Teléfono:</span>{" "}
              {ca.resident_doctor.phone || "N/A"}
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4 mt-6">
            Médico Supervisor
          </h2>
          <ul className="space-y-2 text-white/80">
            <li>
              <span className="text-white/50">Nombre:</span>{" "}
              {ca.supervisor_doctor.first_name} {ca.supervisor_doctor.last_name}
            </li>
            <li>
              <span className="text-white/50">Email:</span>{" "}
              {ca.supervisor_doctor.email || "N/A"}
            </li>
            <li>
              <span className="text-white/50">Teléfono:</span>{" "}
              {ca.supervisor_doctor.phone || "N/A"}
            </li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        clinicalAttention={ca}
        onSuccess={handleEditSuccess}
      />
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        clinicalAttentionId={ca.id}
        deleted_by_id={deletor}
      />
    </div>
  );
}
