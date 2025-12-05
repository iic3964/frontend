import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import DeleteModal from "./DeleteModal";
import EditModal from "./EditModal";
import ResidentApprovalCard from "./ResidentApprovalCard";
import SupervisorActionCard from "./SupervisorActionCard";

// =====================
// PARSE CLINICAL SUMMARY TXT
// =====================
export const parseClinicalSummary = (txt) => {
  if (!txt) return null;

  try {
    const raw = txt
      .split("=====")
      .map((s) => s.trim());

    const output = {
      triage: "",
      motivoConsulta: "",
      anamnesis: "",
      signosVitalesRaw: "",
      signosVitales: {},
      hallazgos: "",
      diagnostico: "",
    };

    for (let i = 0; i < raw.length; i++) {
      const block = raw[i].toLowerCase();

      if (block === "triage") output.triage = raw[i + 1] || "";
      if (block === "motivo de consulta")
        output.motivoConsulta = raw[i + 1] || "";
      if (block === "anamnesis") output.anamnesis = raw[i + 1] || "";
      if (block === "signos vitales") output.signosVitalesRaw = raw[i + 1] || "";
      if (block === "hallazgos clínicos") output.hallazgos = raw[i + 1] || "";
      if (block === "diagnóstico presuntivo")
        output.diagnostico = raw[i + 1] || "";
    }

    // Parse signos vitales
    if (output.signosVitalesRaw) {
      output.signosVitalesRaw.split("\n").forEach((l) => {
        if (l.includes(":")) {
          const [k, v] = l.split(":").map((x) => x.trim());
          output.signosVitales[k] = v;
        }
      });
    }

    return output;
  } catch (error) {
    console.error("Error parsing clinical summary:", error);
    return null;
  }
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
    <div className="group relative flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-health-border overflow-hidden transition-all hover:bg-gray-100 h-20">
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
          <p className="text-xs text-health-text-muted uppercase tracking-wide font-semibold">
            {title}
          </p>
          <p className="text-health-text font-medium truncate">
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
          <div className="flex items-center gap-2 text-xs text-health-text-muted truncate">
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

  const [polling, setPolling] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let timer;

    if (isUpdating) {
      timer = setTimeout(() => {
        fetchData(true);
        setIsUpdating(false);
      }, 30000);
    }

    return () => clearTimeout(timer);
  }, [isUpdating]);

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
        supervisor_approved: null,
        supervisor_observation: null
      });
    } catch (error) {
      console.error("Failed to reset overwritten fields:", error);
    }

    setIsUpdating(true);

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
          <span className="text-health-text-muted text-sm">
            Cargando información...
          </span>
        </div>
      </div>
    );
  }

  if (error || !clinicalAttention) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
          {error || "No se encontraron datos"}
        </div>
        <a
          href="/clinical_attentions"
          className="text-health-accent hover:underline text-sm font-medium"
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
  const canEdit = userRole === "admin" || (userRole === "resident" && isOwner);

  return (
    <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-500 relative">
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
        {clinicalAttention?.id_episodio && (
          <div className="text-health-text text-sm font-mono bg-gray-50 px-3 py-1 rounded-md border border-health-border">
            ID Episodio:{" "}
            <span className="text-health-accent font-semibold">
              {clinicalAttention?.id_episodio}
            </span>
          </div>
        )}

        {canEdit && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              disabled={ca.is_closed}
              className="rounded-lg bg-health-accent text-white px-4 py-2 text-sm font-medium hover:bg-health-accent-dark transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Editar
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-medium hover:bg-red-600 transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        {/* COLUMNA 1: DATOS PACIENTE */}
        <div className="bg-white p-5 rounded-xl border border-health-border shadow-xl h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-health-accent">
            Datos del Paciente
          </h2>
          <ul className="space-y-2 text-health-text flex-1">
            <li>
              <span className="text-health-text-muted">Nombre:</span>{" "}
              {ca.patient.first_name} {ca.patient.last_name}
            </li>
            <li>
              <span className="text-health-text-muted">RUT:</span>{" "}
              {ca.patient.rut}
            </li>
            <li>
              <span className="text-health-text-muted">Teléfono:</span>{" "}
              {ca.patient.phone || "N/A"}
            </li>
            <li>
              <span className="text-health-text-muted">Dirección:</span>{" "}
              {ca.patient.address || "N/A"}
            </li>
            <li>
              <span className="text-health-text-muted">Ciudad:</span>{" "}
              {ca.patient.city || "N/A"}
            </li>
          </ul>
        </div>

        {/* COLUMNA 2: EQUIPO MÉDICO */}
        <div className="bg-white p-5 rounded-xl border border-health-border shadow-xl h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-health-accent flex items-center gap-2">
            Equipo Médico
          </h2>

          <div className="space-y-4 flex-1">
            <DoctorCard
              title="Médico Residente"
              firstName={ca.resident_doctor.first_name}
              lastName={ca.resident_doctor.last_name}
              email={ca.resident_doctor.email}
              phone={ca.resident_doctor.phone}
              initial="R"
              colorClass="bg-health-accent/20 text-health-accent"
            />
            <DoctorCard
              title="Jefe de Turno"
              firstName={ca.supervisor_doctor.first_name}
              lastName={ca.supervisor_doctor.last_name}
              email={ca.supervisor_doctor.email}
              phone={ca.supervisor_doctor.phone}
              initial="S"
              colorClass="bg-purple-500/20 text-purple-400"
            />
          </div>

          <div className="px-1 text-right mt-4">
            <div className="text-xs text-health-text-muted space-y-1">
              <p>Creado: {formatDate(ca.created_at)}</p>
              <p>Última act.: {formatDate(ca.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-start">
        {/* COLUMNA 1: INFORMACIÓN CLÍNICA */}
        <div className="bg-white p-5 rounded-xl border border-health-border shadow-xl backdrop-blur-md h-full">
          <h2 className="text-lg font-semibold mb-4 text-health-accent">
            Información Clínica
          </h2>
          {/* MOTIVO DE CONSULTA */}
          <div className="mb-6">
            <h3 className="text-sm text-health-text-muted font-semibold uppercase tracking-wide">
              Motivo de Consulta
            </h3>
            <p className="text-health-text mt-2 leading-relaxed whitespace-pre-line">
              {parsed?.motivoConsulta || "N/A"}
            </p>
          </div>

          {/* TRIAGE */}
          <div className="mb-6">
            <h3 className="text-sm text-health-text-muted font-semibold uppercase tracking-wide">
              Triage
            </h3>
            {parsed?.triage ? (
              <span
                className={`
              inline-block mt-2 px-3 py-1 rounded-lg text-sm font-semibold
              ${
                parsed.triage === "1"
                  ? "bg-red-600 text-white"
                  : parsed.triage === "2"
                  ? "bg-orange-500 text-white"
                  : parsed.triage === "3"
                  ? "bg-yellow-500 text-white"
                  : parsed.triage === "4"
                  ? "bg-blue-500 text-white"
                  : "bg-green-500 text-white"
              }
            `}
              >
                Nivel {parsed.triage}
              </span>
            ) : (
              <p className="text-health-text-muted mt-2">No registrado</p>
            )}
          </div>

          {/* ANAMNESIS */}
          <div className="mb-6">
            <h3 className="text-sm text-health-text-muted font-semibold uppercase tracking-wide">
              Anamnesis
            </h3>
            <p className="text-health-text mt-2 leading-relaxed whitespace-pre-line">
              {parsed?.anamnesis || "N/A"}
            </p>
          </div>

          {/* SIGNOS VITALES */}
          <div className="mb-6">
            <h3 className="text-sm text-health-text-muted font-semibold uppercase tracking-wide">
              Signos Vitales
            </h3>
            {parsed?.signosVitales &&
            Object.keys(parsed.signosVitales).length > 0 ? (
              <div className="grid grid-cols-2 gap-4 mt-3">
                {Object.entries(parsed.signosVitales).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex flex-col bg-gray-50 border border-health-border rounded-lg p-3"
                  >
                    <span className="text-xs text-health-text-muted">{k}</span>
                    <span className="text-health-text font-medium mt-1">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-health-text-muted mt-2">No registrados</p>
            )}
          </div>

          {/* HALLAZGOS */}
          <div className="mb-6">
            <h3 className="text-sm text-health-text-muted font-semibold uppercase tracking-wide">
              Hallazgos Clínicos
            </h3>
            <p className="text-health-text mt-2 leading-relaxed whitespace-pre-line">
              {parsed?.hallazgos || "N/A"}
            </p>
          </div>

          {/* DIAGNÓSTICO */}
          <div>
            <h3 className="text-sm text-health-text-muted font-semibold uppercase tracking-wide">
              Diagnóstico Presuntivo
            </h3>
            <p className="text-health-text mt-2 leading-relaxed whitespace-pre-line">
              {parsed?.diagnostico || ca.diagnostic}
            </p>
          </div>
        </div>

        {/* COLUMNA 2: ANÁLISIS IA */}
        <div className="bg-white p-5 rounded-xl border border-health-border shadow-xl backdrop-blur-md h-full">
          <h2 className="text-lg font-semibold mb-4 text-health-accent">
            Análisis IA
          </h2>

          <ul className="space-y-3 text-health-text">
            <li>
              <span className="text-health-text-muted">Ley de Urgencia:</span>
              {isUpdating ? (
                <span className="ml-2 text-health-text-muted italic text-xs">
                  Cargando...
                </span>
              ) : (
                <span
                  className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
                    ca.applies_urgency_law === true
                      ? "bg-green-50 text-green-600"
                      : ca.applies_urgency_law === false
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-100 text-gray-600"
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
              <span className="text-health-text-muted">Resultado IA:</span>
              {isUpdating ? (
                <span className="ml-2 text-health-text-muted italic text-xs">
                  Cargando...
                </span>
              ) : (
                <span
                  className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
                    ca.ai_result === true
                      ? "bg-green-50 text-green-600"
                      : ca.ai_result === false
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ca.ai_result === true
                    ? "Aplica"
                    : ca.ai_result === false
                    ? "No Aplica"
                    : "Pendiente"}
                </span>
              )}
            </li>

            {(ca.ai_result === null || isUpdating) && (
              <li className="flex items-center gap-2 text-health-text-muted mt-2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-health-accent rounded-full"></div>
                <span>Procesando diagnóstico...</span>
              </li>
            )}

            <li>
              <span className="text-health-text-muted">Confianza IA:</span>
              {isUpdating ? (
                <span className="ml-2 text-health-text-muted italic text-xs">
                  Cargando...
                </span>
              ) : ca.ai_confidence !== null ? (
                <span
                  className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
                    ca.ai_confidence >= 0.8
                      ? "bg-green-500/20 text-black"
                      : "bg-yellow-500/20 text-black"
                  }`}
                >
                  {(ca.ai_confidence * 100).toFixed(0)}%
                </span>
              ) : (
                <span className="ml-2 text-health-text-muted">N/A</span>
              )}
            </li>

            <li>
              <span className="text-health-text-muted">Razón IA:</span>{" "}
              {isUpdating ? (
                <span className="text-health-text-muted italic">
                  Cargando...
                </span>
              ) : (
                ca.ai_reason || "N/A"
              )}
            </li>
          </ul>

          {/* ================================================== */}
          {/* BLOQUE APROBACIÓN MÉDICO RESIDENTE (COMPONENTE) */}
          {/* ================================================== */}
          <ResidentApprovalCard
            clinicalAttention={ca}
            userRole={userRole}
            onUpdate={fetchData}
          />

          {/* ================================================== */}
          {/* BLOQUE GESTIÓN SUPERVISOR (COMPONENTE) */}
          {/* ================================================== */}
          <SupervisorActionCard
            clinicalAttention={ca}
            userRole={userRole}
            onUpdate={fetchData}
          />

          {/* ================================================== */}
          {/* MENSAJES DE ESTADO SUPERVISOR (Visible para Residentes/Todos) */}
          {/* ================================================== */}
          {userRole === 'resident' && (
            <>
              {ca.supervisor_approved === false && (
                <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-xl">
                  <h3 className="text-red-700 font-bold mb-1">Caso Objetado por Supervisor</h3>
                  <p className="text-sm text-red-600 italic">"{ca.supervisor_observation}"</p>
                </div>
              )}

              {ca.supervisor_approved === true && (
                <div className="mt-6 bg-purple-50 border border-purple-200 p-4 rounded-xl">
                  <h3 className="text-purple-700 font-bold mb-1">Caso Ratificado por Supervisor</h3>
                  {ca.supervisor_observation && (
                    <p className="text-sm text-purple-600 italic">"{ca.supervisor_observation}"</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* AVISO DE SOBRESCRITURA (Legacy/Internal) */}
          {ca.overwritten_reason && ca.overwritten_reason.trim() !== "" && (
            <div className="mt-6 bg-yellow-600/10 border border-yellow-500/30 p-4 rounded-xl">
              <h3 className="text-yellow-400 font-semibold text-sm mb-2">
                Atención Sobrescrita (Legacy)
              </h3>
              <p className="text-health-text whitespace-pre-line text-sm mb-3">
                {ca.overwritten_reason}
              </p>
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
