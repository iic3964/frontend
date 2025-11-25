import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import DeleteModal from "./DeleteModal";
import EditModal from "./EditModal";

// =====================
// PARSE CLINICAL SUMMARY TXT
// =====================
const parseClinicalSummary = (txt) => {
  if (!txt) return null;

  const raw = txt
    .split("=====")
    .map((s) => s.trim())
    .filter(Boolean);

  const output = {
    anamnesis: "",
    signosVitalesRaw: "",
    signosVitales: {},
    hallazgos: "",
    diagnostico: "",
  };

  for (let i = 0; i < raw.length; i++) {
    const block = raw[i].toLowerCase();

    if (block === "anamnesis") output.anamnesis = raw[i + 1] || "";
    if (block === "signos vitales") output.signosVitalesRaw = raw[i + 1] || "";
    if (block === "hallazgos clínicos") output.hallazgos = raw[i + 1] || "";
    if (block === "diagnóstico presuntivo")
      output.diagnostico = raw[i + 1] || "";
  }

  if (output.signosVitalesRaw) {
    output.signosVitalesRaw.split("\n").forEach((l) => {
      if (l.includes(":")) {
        const [k, v] = l.split(":").map((x) => x.trim());
        output.signosVitales[k] = v;
      }
    });
  }

  return output;
};

// =====================
// COMPONENTE TARJETA MÉDICO (HOVER EFFECT)
// =====================
const DoctorCard = ({
  title,
  firstName,
  lastName,
  email,
  phone,
  initial,
  colorClass,
}) => {
  return (
    <div className="group relative flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 h-20">
      {/* Avatar (Siempre visible) */}
      <div
        className={`w-10 h-10 flex-shrink-0 rounded-full ${colorClass} flex items-center justify-center font-bold z-10 shadow-lg`}
      >
        {initial}
      </div>

      {/* Contenedor de Textos (Swap Effect) */}
      <div className="flex-1 relative h-full flex flex-col justify-center overflow-hidden">
        {/* VISTA NORMAL: Rol y Nombre */}
        <div className="absolute w-full transition-all duration-300 transform group-hover:-translate-y-12 group-hover:opacity-0 flex flex-col justify-center">
          <p className="text-xs text-white/50 uppercase tracking-wide font-semibold">
            {title}
          </p>
          <p className="text-white font-medium truncate">
            {firstName} {lastName}
          </p>
        </div>

        {/* VISTA HOVER: Email y Teléfono */}
        <div className="absolute w-full transition-all duration-300 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 flex flex-col justify-center gap-1">
          {/* Email con Icono SVG */}
          <div className="flex items-center gap-2 text-xs text-health-accent truncate">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 flex-shrink-0 opacity-80"
            >
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
            <span className="truncate">{email || "Sin email"}</span>
          </div>

          {/* Teléfono con Icono SVG */}
          <div className="flex items-center gap-2 text-xs text-white/70 truncate">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 flex-shrink-0 opacity-80"
            >
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 4.5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="truncate">{phone || "Sin teléfono"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ClinicalAttentionDetail({ attentionId }) {
  const [clinicalAttention, setClinicalAttention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);

  const [polling, setPolling] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [rejectMode, setRejectMode] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem("saluia.session");
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setCurrentUser(session.user);
    }
    fetchData();
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
        setApprovalReason(response.data.medic_reject_reason || "");

        // Si ya tenemos resultado y veníamos de un update, quitamos el estado de carga
        if (isUpdating && response.data.ai_result !== null) {
          setIsUpdating(false);
        }

        setPolling(response.data.ai_result === null);
      } else {
        setError(response.error || "Error al cargar los datos");
      }
    } catch (err) {
      setError("Error de conexión al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [polling]);

  const handleEditSuccess = async () => {
    setShowEditModal(false);

    try {
      await apiClient.updateClinicalAttention(clinicalAttention.id, {
        overwritten_by: null,
        overwritten_reason: null,
        medic_approved: null,
      });
    } catch (error) {
      console.error("Failed to reset overwritten fields:", error);
    }

    setIsUpdating(true);
    setShowUpdateSuccessModal(true);

    fetchData();
  };

  const closeUpdateSuccessModal = () => {
    setShowUpdateSuccessModal(false);
  };

  const handleMedicApproval = async (approved) => {
    if (!approved && approvalReason.trim().length < 3) {
      alert("Debes ingresar una razón para rechazar.");
      return;
    }

    const id = clinicalAttention.id;
    const medicId = currentUser?.id;

    if (!medicId) {
      alert("Error de sesión: No se identificó al médico.");
      return;
    }

    const resp = await apiClient.AproveClinicalAttention(
      id,
      approved,
      approved ? "" : approvalReason,
      medicId
    );

    if (resp.success) {
      fetchData();
      setRejectMode(false);
    } else {
      alert("Error al actualizar aprobación.");
    }
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
  const parsed = parseClinicalSummary(ca.diagnostic);

  const userRole = currentUser?.user_metadata?.role;
  const userId = currentUser?.id;
  const isOwner = ca.resident_doctor?.id === userId;
  const canEdit =
    userRole === "supervisor" || (userRole === "resident" && isOwner);

  return (
    <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-500 relative">
      {/* ===================== */}
      {/* MODAL SUCCESS UPDATE  */}
      {/* ===================== */}
      {showUpdateSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-health-accent/30 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 text-center">
            <div className="w-12 h-12 bg-health-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 text-health-accent">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Consulta en proceso de actualización
            </h3>
            <p className="text-white/60 text-sm mb-6">
              Por favor, espera unos segundos y vuelve a refrescar la página
              para ver el nuevo análisis.
            </p>
            <button
              onClick={closeUpdateSuccessModal}
              className="w-full bg-health-accent text-black font-semibold py-2 rounded-lg hover:bg-health-accent/90 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

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

      {/* ================================================= */}
      {/* FILA 1 (ARRIBA)                   */}
      {/* Datos Paciente (Izq) --- Equipo Médico (Der)  */}
      {/* ================================================= */}

      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        {/* COLUMNA 1: DATOS PACIENTE */}
        <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-health-accent">
            Datos del Paciente
          </h2>
          <ul className="space-y-2 text-white/80 flex-1">
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
        </div>

        {/* COLUMNA 2: EQUIPO MÉDICO */}
        <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-health-accent flex items-center gap-2">
            Equipo Médico
          </h2>

          <div className="space-y-4 flex-1">
            {/* Médico Residente (Hoverable) */}
            <DoctorCard
              title="Médico Residente"
              firstName={ca.resident_doctor.first_name}
              lastName={ca.resident_doctor.last_name}
              email={ca.resident_doctor.email}
              phone={ca.resident_doctor.phone}
              initial="R"
              colorClass="bg-health-accent/20 text-health-accent"
            />

            {/* Médico Supervisor (Hoverable) */}
            <DoctorCard
              title="Médico Supervisor"
              firstName={ca.supervisor_doctor.first_name}
              lastName={ca.supervisor_doctor.last_name}
              email={ca.supervisor_doctor.email}
              phone={ca.supervisor_doctor.phone}
              initial="S"
              colorClass="bg-purple-500/20 text-purple-400"
            />
          </div>

          <div className="px-1 text-right mt-4">
            <div className="text-xs text-white/30 space-y-1">
              <p>Creado: {formatDate(ca.created_at)}</p>
              <p>Última act.: {formatDate(ca.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* FILA 2 (ABAJO)                    */}
      {/* Información Clínica (Izq) --- Análisis IA (Der) */}
      {/* ================================================= */}

      <div className="grid gap-6 md:grid-cols-2 items-start">
        {/* COLUMNA 1: INFORMACIÓN CLÍNICA */}
        <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md h-full">
          <h2 className="text-lg font-semibold mb-4 text-health-accent">
            Información Clínica
          </h2>

          {/* ANAMNESIS */}
          <div className="mb-6">
            <h3 className="text-sm text-white/60 font-semibold uppercase tracking-wide">
              Anamnesis
            </h3>
            <p className="text-white/80 mt-2 leading-relaxed whitespace-pre-line">
              {parsed?.anamnesis || "N/A"}
            </p>
          </div>

          {/* SIGNOS VITALES */}
          <div className="mb-6">
            <h3 className="text-sm text-white/60 font-semibold uppercase tracking-wide">
              Signos Vitales
            </h3>
            {parsed?.signosVitales &&
            Object.keys(parsed.signosVitales).length > 0 ? (
              <div className="grid grid-cols-2 gap-4 mt-3">
                {Object.entries(parsed.signosVitales).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex flex-col bg-black/20 border border-white/10 rounded-lg p-3"
                  >
                    <span className="text-xs text-white/50">{k}</span>
                    <span className="text-white/90 font-medium mt-1">{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 mt-2">No registrados</p>
            )}
          </div>

          {/* HALLAZGOS */}
          <div className="mb-6">
            <h3 className="text-sm text-white/60 font-semibold uppercase tracking-wide">
              Hallazgos Clínicos
            </h3>
            <p className="text-white/80 mt-2 leading-relaxed whitespace-pre-line">
              {parsed?.hallazgos || "N/A"}
            </p>
          </div>

          {/* DIAGNÓSTICO */}
          <div>
            <h3 className="text-sm text-white/60 font-semibold uppercase tracking-wide">
              Diagnóstico Presuntivo
            </h3>
            <p className="text-white/80 mt-2 leading-relaxed whitespace-pre-line">
              {parsed?.diagnostico || ca.diagnostic}
            </p>
          </div>
        </div>

        {/* COLUMNA 2: ANÁLISIS IA */}
        <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md h-full">
          <h2 className="text-lg font-semibold mb-4 text-health-accent">
            Análisis IA
          </h2>

          <ul className="space-y-3 text-white/80">
            <li>
              <span className="text-white/50">Ley de Urgencia:</span>

              {isUpdating ? (
                <span className="ml-2 text-white/40 italic text-xs">
                  Cargando...
                </span>
              ) : (
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
              )}
            </li>

            <li>
              <span className="text-white/50">Resultado IA:</span>

              {isUpdating ? (
                <span className="ml-2 text-white/40 italic text-xs">
                  Cargando...
                </span>
              ) : (
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
              )}
            </li>

            {(ca.ai_result === null || isUpdating) && (
              <li className="flex items-center gap-2 text-white/70 mt-2">
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                <span>Procesando diagnóstico...</span>
              </li>
            )}

            <li>
              <span className="text-white/50">Confianza IA:</span>
              {isUpdating ? (
                <span className="ml-2 text-white/40 italic text-xs">
                  Cargando...
                </span>
              ) : ca.ai_confidence !== null ? (
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
              {isUpdating ? (
                <span className="text-white/40 italic">Cargando...</span>
              ) : (
                ca.ai_reason || "N/A"
              )}
            </li>
          </ul>

          {/* APROBACIÓN MÉDICA */}
          {canEdit && ca.medic_approved === null && !isUpdating && (
            <div className="mt-6 bg-black/20 border border-white/10 p-4 rounded-xl">
              <h3 className="text-white text-md font-semibold mb-3">
                Aprobación del Médico
              </h3>

              {rejectMode ? (
                <>
                  <div className="mb-3">
                    <label className="text-white/50 text-sm">
                      Razón del rechazo
                    </label>
                    <textarea
                      className="w-full mt-1 p-2 bg-black/40 border border-white/10 rounded-lg text-white"
                      rows={2}
                      value={approvalReason}
                      onChange={(e) => setApprovalReason(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={() => handleMedicApproval(false)}
                    className="bg-red-600/40 text-red-300 px-4 py-2 rounded-lg hover:bg-red-600/60 transition"
                  >
                    Enviar Rechazo
                  </button>

                  <button
                    onClick={() => {
                      setRejectMode(false);
                      setApprovalReason("");
                    }}
                    className="ml-3 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleMedicApproval(true)}
                    className="bg-green-600/30 text-green-400 px-4 py-2 rounded-lg hover:bg-green-600/50 transition"
                  >
                    Aprobar resultado IA
                  </button>

                  <button
                    onClick={() => setRejectMode(true)}
                    className="bg-red-600/30 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/50 transition"
                  >
                    Rechazar resultado IA
                  </button>
                </div>
              )}
            </div>
          )}

          {ca.medic_approved === true && (
            <div className="mt-6 bg-green-600/10 border border-green-500/30 p-4 rounded-xl flex items-start gap-3">
              <div className="mt-1 text-green-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-green-400 font-semibold text-sm mt-1">
                  Diagnóstico Validado
                </h3>
              </div>
            </div>
          )}

          {/* AVISO DE SOBRESCRITURA */}
          {ca.overwritten_reason && ca.overwritten_reason.trim() !== "" && (
            <div className="mt-6 bg-yellow-600/10 border border-yellow-500/30 p-4 rounded-xl">
              <h3 className="text-yellow-400 font-semibold text-sm mb-2">
                Atención Sobrescrita
              </h3>

              <p className="text-white/80 whitespace-pre-line text-sm mb-3">
                {ca.overwritten_reason}
              </p>

              {ca.overwritten_by && (
                <div className="text-white/60 text-xs">
                  <span className="font-semibold text-yellow-300">
                    Sobrescrito por:
                  </span>{" "}
                  {ca.overwritten_by.first_name} {ca.overwritten_by.last_name}
                </div>
              )}
            </div>
          )}
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
