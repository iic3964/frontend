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
    diagnostico: ""
  };

  // Recorremos como pares: TITULO -> CONTENIDO
  for (let i = 0; i < raw.length; i++) {
    const block = raw[i].toLowerCase();

    if (block === "anamnesis") output.anamnesis = raw[i + 1] || "";
    if (block === "signos vitales") output.signosVitalesRaw = raw[i + 1] || "";
    if (block === "hallazgos clínicos") output.hallazgos = raw[i + 1] || "";
    if (block === "diagnóstico presuntivo") output.diagnostico = raw[i + 1] || "";
  }

  // Parse signos vitales
  output.signosVitalesRaw.split("\n").forEach((l) => {
    if (l.includes(":")) {
      const [k, v] = l.split(":").map((x) => x.trim());
      output.signosVitales[k] = v;
    }
  });

  return output;
};

export default function ClinicalAttentionDetail() {
  const [clinicalAttention, setClinicalAttention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [polling, setPolling] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const medicId = "fc2cf1ed-6c48-4b71-b284-f3825b9b67bd"; // TODO: replace with session
  const [rejectMode, setRejectMode] = useState(false);

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
        setApprovalReason(response.data.medic_reject_reason || "");
        setPolling(response.data.ai_result === null);
      } else {
        setError(response.error || "Error al cargar los datos");
      }
    } catch (err) {
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [polling]);
   const handleMedicApproval = async (approved) => {
    if (!approved && approvalReason.trim().length < 3) {
      alert("Debes ingresar una razón para rechazar.");
      return;
    }

    const id = clinicalAttention.id;
    const resp = await apiClient.AproveClinicalAttention(
      id,
      approved,
      approved ? "" : approvalReason,
      medicId
    );

    if (resp.success) {
      fetchData();
    } else {
      alert("Error al actualizar aprobación.");
    }
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
        <a href="/clinical_attentions" className="text-health-accent hover:underline">
          ← Volver a lista de atenciones
        </a>
      </div>
    );
  }

  const ca = clinicalAttention;
  // 🔥 FIX REAL: usar clinical_summary_txt
  const parsed = parseClinicalSummary(ca.diagnostic);

  const deletor = "392c3fe1-ee87-4bbb-ae46-d2733a84bf8f";

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <a href="/clinical_attentions" className="text-health-accent hover:underline text-sm">
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

      {/* ========================= */}
{/*        GRID PRINCIPAL     */}
{/* ========================= */}

<div className="grid gap-6 md:grid-cols-2">

  {/* ========================= */}
  {/* FILA 1: PACIENTE + MÉDICOS */}
  {/* ========================= */}

  {/* COLUMNA 1: PACIENTE */}
  <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md">
    <h2 className="text-lg font-semibold mb-4 text-health-accent">Datos del Paciente</h2>
    <ul className="space-y-2 text-white/80">
      <li><span className="text-white/50">Nombre:</span> {ca.patient.first_name} {ca.patient.last_name}</li>
      <li><span className="text-white/50">RUT:</span> {ca.patient.rut}</li>
      <li><span className="text-white/50">Email:</span> {ca.patient.email || "N/A"}</li>
      <li><span className="text-white/50">Teléfono:</span> {ca.patient.phone || "N/A"}</li>
      <li><span className="text-white/50">Dirección:</span> {ca.patient.address || "N/A"}</li>
      <li><span className="text-white/50">Ciudad:</span> {ca.patient.city || "N/A"}</li>
    </ul>
  </div>

  {/* COLUMNA 2: MÉDICOS */}
  <div className="flex flex-col gap-6">

    <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md">
      <h2 className="text-lg font-semibold mb-4 text-health-accent">Médico Residente</h2>
      <ul className="space-y-2 text-white/80">
        <li><span className="text-white/50">Nombre:</span> {ca.resident_doctor.first_name} {ca.resident_doctor.last_name}</li>
        <li><span className="text-white/50">Email:</span> {ca.resident_doctor.email || "N/A"}</li>
        <li><span className="text-white/50">Teléfono:</span> {ca.resident_doctor.phone || "N/A"}</li>
      </ul>
    </div>

    <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md">
      <h2 className="text-lg font-semibold mb-4 text-health-accent">Médico Supervisor</h2>
      <ul className="space-y-2 text-white/80">
        <li><span className="text-white/50">Nombre:</span> {ca.supervisor_doctor.first_name} {ca.supervisor_doctor.last_name}</li>
        <li><span className="text-white/50">Email:</span> {ca.supervisor_doctor.email || "N/A"}</li>
        <li><span className="text-white/50">Teléfono:</span> {ca.supervisor_doctor.phone || "N/A"}</li>
      </ul>
    </div>

  </div>

  {/* ========================= */}
  {/* FILA 2: CLÍNICA + IA */}
  {/* ========================= */}

  {/* COLUMNA 1: INFORMACIÓN CLÍNICA */}
  <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md">
    <h2 className="text-lg font-semibold mb-4 text-health-accent">Información Clínica</h2>

    {/* ANAMNESIS */}
    <div className="mb-6">
      <h3 className="text-sm text-white/60 font-semibold uppercase tracking-wide">Anamnesis</h3>
      <p className="text-white/80 mt-2 leading-relaxed whitespace-pre-line">{parsed.anamnesis}</p>
    </div>

    {/* SIGNOS VITALES */}
    <div className="mb-6">
      <h3 className="text-sm text-white/60 font-semibold uppercase tracking-wide">Signos Vitales</h3>

      <div className="grid grid-cols-2 gap-4 mt-3">
        {Object.entries(parsed.signosVitales).map(([k, v]) => (
          <div key={k} className="flex flex-col bg-black/20 border border-white/10 rounded-lg p-3">
            <span className="text-xs text-white/50">{k}</span>
            <span className="text-white/90 font-medium mt-1">{v}</span>
          </div>
        ))}
      </div>
    </div>

    {/* HALLAZGOS */}
    <div className="mb-6">
      <h3 className="text-sm text-white/60 font-semibold uppercase tracking-wide">Hallazgos Clínicos</h3>
      <p className="text-white/80 mt-2 leading-relaxed whitespace-pre-line">{parsed.hallazgos}</p>
    </div>

    {/* DIAGNÓSTICO */}
    <div>
      <h3 className="text-sm text-white/60 font-semibold uppercase tracking-wide">Diagnóstico Presuntivo</h3>
      <p className="text-white/80 mt-2 leading-relaxed whitespace-pre-line">{parsed.diagnostico}</p>
    </div>
  </div>

  
  {/* COLUMNA 2: IA */}
{/* COLUMNA 2: IA */}
<div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md">
  <h2 className="text-lg font-semibold mb-4 text-health-accent">Análisis IA</h2>

  <ul className="space-y-3 text-white/80">
    <li>
      <span className="text-white/50">Ley de Urgencia:</span>
      <span className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
        ca.applies_urgency_law === true
          ? "bg-green-600/20 text-green-400"
          : ca.applies_urgency_law === false
          ? "bg-red-500/20 text-red-400"
          : "bg-white/10 text-white/70"
      }`}>
        {ca.applies_urgency_law === true ? "Sí" :
         ca.applies_urgency_law === false ? "No" : "Pendiente"}
      </span>
    </li>

    <li>
      <span className="text-white/50">Resultado IA:</span>
      <span className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
        ca.ai_result === true
          ? "bg-green-500/20 text-green-400"
          : ca.ai_result === false
          ? "bg-red-500/20 text-red-400"
          : "bg-white/10 text-white/70"
      }`}>
        {ca.ai_result === true ? "Aprobado" :
         ca.ai_result === false ? "Rechazado" : "Pendiente"}
      </span>
    </li>

    {ca.ai_result === null && (
      <li className="flex items-center gap-2 text-white/70 mt-2">
        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
        <span>Procesando diagnóstico...</span>
      </li>
    )}

    <li>
      <span className="text-white/50">Confianza IA:</span>
      {ca.ai_confidence !== null ? (
        <span className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
          ca.ai_confidence >= 0.8
            ? "bg-green-500/20 text-green-400"
            : "bg-yellow-500/20 text-yellow-300"
        }`}>
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
  </ul>

  {/* ================================ */}
  {/*       APROBACIÓN MÉDICA          */}
  {/* ================================ */}
  {ca.medic_approved === null && (
    <div className="mt-6 bg-black/20 border border-white/10 p-4 rounded-xl">

      <h3 className="text-white text-md font-semibold mb-3">
        Aprobación del Médico
      </h3>

      

      {/*  Estado local para saber si presionó "Rechazar IA" */}
      {rejectMode ? (
        <>
          {/* Reason text area */}
          <div className="mb-3">
            <label className="text-white/50 text-sm">Razón del rechazo</label>
            <textarea
              className="w-full mt-1 p-2 bg-black/40 border border-white/10 rounded-lg text-white"
              rows={2}
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
            />
          </div>

          {/* Submit button */}
          <button
            onClick={() => handleMedicApproval(false)}
            className="bg-red-600/40 text-red-300 px-4 py-2 rounded-lg hover:bg-red-600/60 transition"
          >
            Enviar Rechazo
          </button>

          {/* Cancel reject mode */}
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
          {/* Aprobar */}
          <button
            onClick={() => handleMedicApproval(true)}
            className="bg-green-600/30 text-green-400 px-4 py-2 rounded-lg hover:bg-green-600/50 transition"
          >
            Aprobar resultado IA
          </button>

          {/* Activar modo rechazo */}
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
        <span className="font-semibold text-yellow-300">Sobrescrito por:</span>{" "}
        {ca.overwritten_by.first_name} {ca.overwritten_by.last_name}
      </div>
    )}
  </div>
)}




  {/* ================================ */}
  {/*   FIN APROBACIÓN MÉDICA          */}
  {/* ================================ */}
</div>



</div>


      {/* MODALS */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        clinicalAttention={ca}
        onSuccess={fetchData}
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
