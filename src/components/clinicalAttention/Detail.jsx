import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import DeleteModal from "./DeleteModal";
import EditModal from "./EditModal";

export default function ClinicalAttentionDetail({ attentionId }) {
  const [clinicalAttention, setClinicalAttention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem("saluia.session");
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setCurrentUser(session.user);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attentionId]);

  const fetchData = async () => {
    let id = attentionId;

    if (!id) {
      const pathname = window.location.pathname;
      const parts = pathname.split("/");
      id = parts[parts.length - 1];
    }

    if (!id || id === "details") {
      setError("No se encontró el ID de la atención clínica");
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.getClinicalAttention(id);

      if (response.success && response.data) {
        setClinicalAttention(response.data);
      } else {
        setError(response.error || "Error al cargar los datos");
      }
    } catch (err) {
      setError("Error de conexión al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setLoading(true);
    fetchData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-health-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white/50 text-sm">Cargando información...</span>
        </div>
      </div>
    );
  }

  if (error || !clinicalAttention) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
          {error || "No se encontraron datos"}
        </div>
        <a
          href="/clinical_attentions"
          className="text-health-accent hover:underline text-sm"
        >
          ← Volver a lista de atenciones
        </a>
      </div>
    );
  }

  const ca = clinicalAttention;
  const userRole = currentUser?.user_metadata?.role;
  const userId = currentUser?.id;
  const isOwner = ca.resident_doctor?.id === userId;
  const canEdit =
    userRole === "supervisor" || (userRole === "resident" && isOwner);

  return (
    <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <a
          href="/clinical_attentions"
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
          Volver a lista
        </a>

        {canEdit && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="rounded-lg bg-health-accent text-black px-4 py-2 text-sm font-medium hover:bg-health-accent-dark transition shadow-lg shadow-health-accent/10 flex items-center gap-2"
            >
              Editar
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-medium hover:bg-red-600 transition shadow-lg shadow-red-500/10 flex items-center gap-2"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
          {/* Datos Paciente */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <svg
                className="w-5 h-5 text-health-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Datos del Paciente
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/50">Nombre:</span>
                <span className="text-white font-medium">
                  {ca.patient.first_name} {ca.patient.last_name}
                </span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/50">RUT:</span>
                <span className="text-white font-medium">{ca.patient.rut}</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/50">Email:</span>
                <span className="text-white/80">
                  {ca.patient.email || "N/A"}
                </span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/50">Teléfono:</span>
                <span className="text-white/80">
                  {ca.patient.phone || "N/A"}
                </span>
              </li>
            </ul>
          </div>

          {/* Información Clínica (ACTUALIZADA AQUÍ) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <svg
                className="w-5 h-5 text-health-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Detalle de Atención
            </h2>

            <div className="space-y-6">
              {/* Diagnóstico */}
              <div>
                <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">
                  Diagnóstico
                </span>
                <p className="mt-2 p-3 bg-black/20 border border-white/10 rounded-xl text-white/90 text-sm leading-relaxed">
                  {ca.diagnostic || "Sin diagnóstico registrado."}
                </p>
              </div>

              {/* Grid de Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-white/40 font-semibold block mb-2">
                    Ley Urgencia
                  </span>
                  <span
                    className={`inline-block rounded-lg px-3 py-1.5 text-xs font-medium border ${
                      ca.applies_urgency_law === true
                        ? "bg-health-ok/10 text-health-ok border-health-ok/30"
                        : ca.applies_urgency_law === false
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : "bg-white/5 text-white/60 border-white/10"
                    }`}
                  >
                    {ca.applies_urgency_law === true
                      ? "Sí Aplica"
                      : ca.applies_urgency_law === false
                      ? "No Aplica"
                      : "Pendiente"}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-white/40 font-semibold block mb-2">
                    Resultado IA
                  </span>
                  <span
                    className={`inline-block rounded-lg px-3 py-1.5 text-xs font-medium border ${
                      ca.ai_result === true
                        ? "bg-health-ok/10 text-health-ok border-health-ok/30"
                        : ca.ai_result === false
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : "bg-white/5 text-white/60 border-white/10"
                    }`}
                  >
                    {ca.ai_result === true
                      ? "Aprobado"
                      : ca.ai_result === false
                      ? "Rechazado"
                      : "Pendiente"}
                  </span>
                </div>
                {/* Nuevo: Estado del registro */}
                <div className="col-span-2 md:col-span-1">
                  <span className="text-xs uppercase tracking-wider text-white/40 font-semibold block mb-2">
                    Estado Registro
                  </span>
                  <span
                    className={`inline-block rounded-lg px-3 py-1.5 text-xs font-medium border ${
                      ca.is_deleted
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : "bg-health-ok/10 text-health-ok border-health-ok/30"
                    }`}
                  >
                    {ca.is_deleted ? "Eliminado" : "Activo"}
                  </span>
                </div>
              </div>

              {/* Nuevo: Razón de la IA */}
              <div>
                <span className="text-xs uppercase tracking-wider text-white/40 font-semibold block mb-2">
                  Análisis / Razón IA
                </span>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white/80 text-sm leading-relaxed italic">
                    {ca.ai_reason || "No hay análisis de IA disponible."}
                  </p>
                </div>
              </div>

              {/* Alerta de Sobrescritura */}
              {ca.overwritten_reason && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-yellow-500 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-yellow-500 uppercase">
                        Nota de Edición Manual
                      </h4>
                      <p className="text-white/80 text-sm mt-1">
                        {ca.overwritten_reason}
                      </p>
                      {ca.overwritten_by && (
                        <p className="text-white/40 text-xs mt-2 text-right italic">
                          — Editado por: {ca.overwritten_by.first_name}{" "}
                          {ca.overwritten_by.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <svg
                className="w-5 h-5 text-health-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Equipo Médico
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-health-accent/20 flex items-center justify-center text-health-accent font-bold">
                  {ca.resident_doctor.first_name?.[0]}
                  {ca.resident_doctor.last_name?.[0]}
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide">
                    Médico Residente
                  </p>
                  <p className="text-white font-medium">
                    {ca.resident_doctor.first_name}{" "}
                    {ca.resident_doctor.last_name}
                  </p>
                  <p className="text-white/40 text-xs">
                    {ca.resident_doctor.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  {ca.supervisor_doctor.first_name?.[0]}
                  {ca.supervisor_doctor.last_name?.[0]}
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide">
                    Médico Supervisor
                  </p>
                  <p className="text-white font-medium">
                    {ca.supervisor_doctor.first_name}{" "}
                    {ca.supervisor_doctor.last_name}
                  </p>
                  <p className="text-white/40 text-xs">
                    {ca.supervisor_doctor.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 text-right">
            <div className="text-xs text-white/30 space-y-1">
              <p>ID: {ca.id}</p>
              <p>Creado: {formatDate(ca.created_at)}</p>
              <p>Última act.: {formatDate(ca.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        clinicalAttention={ca}
        onSuccess={handleEditSuccess}
        userRole={userRole}
      />
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        clinicalAttentionId={ca.id}
        deleted_by_id={userId}
      />
    </div>
  );
}
