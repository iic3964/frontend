import { useEffect, useState } from "react";
import { apiClient } from "../modules/api";

export default function SendForm() {
  const [patientId, setPatientId] = useState("");
  const [residentDoctorId, setResidentDoctorId] = useState("");
  const [supervisorDoctorId, setSupervisorDoctorId] = useState("");

  const [medics, setMedics] = useState({ resident: [], supervisor: [] });
  const [medicsLoading, setMedicsLoading] = useState(false);
  const [medicsError, setMedicsError] = useState(null);
  const [idEpisodio, setIdEpisodio] = useState("");

  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState(null);

  // Campos clínicos
  const [anamnesis, setAnamnesis] = useState("");
  const [hallazgosClinicos, setHallazgosClinicos] = useState("");
  const [diagnosticoPresuntivo, setDiagnosticoPresuntivo] = useState("");
  const [motivoConsulta, setMotivoConsulta] = useState("");


  // 🔥 Signos vitales con valores normales
  const [vitales, setVitales] = useState({
      temperatura: "",
      presion_arterial_sistolica: "",
      presion_arterial_diastolica: "",
      frecuencia_cardiaca: "",
      frecuencia_respiratoria: "",
      saturacion_oxigeno: "",
      glasgow: "",
      dolor_escala: "",
      glicemia_capilar: "",
    });


  const updateVital = (field, value) => {
    setVitales((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let mounted = true;

    const loadMedics = async () => {
      setMedicsLoading(true);
      setMedicsError(null);
      try {
        const resp = await apiClient.getMedics();
        if (!mounted) return;
        if (resp.success && resp.data) {
          setMedics(resp.data);
        } else {
          setMedicsError(resp.error || "No se pudieron cargar los médicos");
        }
      } catch (err) {
        if (!mounted) return;
        setMedicsError(err instanceof Error ? err.message : "Error al cargar médicos");
      } finally {
        if (mounted) setMedicsLoading(false);
      }
    };

    const loadPatients = async () => {
      setPatientsLoading(true);
      setPatientsError(null);
      try {
        const resp = await apiClient.getPatients();
        if (!mounted) return;
        if (resp.success && resp.data && Array.isArray(resp.data.patients)) {
          setPatients(resp.data.patients);
        } else {
          setPatientsError(resp.error || "No se pudieron cargar los pacientes");
        }
      } catch (err) {
        if (!mounted) return;
        setPatientsError(err instanceof Error ? err.message : "Error al cargar pacientes");
      } finally {
        if (mounted) setPatientsLoading(false);
      }
    };

    loadMedics();
    loadPatients();

    return () => (mounted = false);
  }, []);
  const [triage, setTriage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 🔥 Construcción del TXT clínico
  const buildClinicalTXT = () => {
      return `
    ===== TRIAGE =====
${triage}

    ===== MOTIVO DE CONSULTA =====
    ${motivoConsulta || "No registrado"}

    ===== ANAMNESIS =====
    ${anamnesis || "No registrado"}

    ===== SIGNOS VITALES =====
    Temperatura: ${vitales.temperatura}
    Presión Arterial: ${vitales.presion_arterial_sistolica}/${vitales.presion_arterial_diastolica}
    Frecuencia Cardíaca: ${vitales.frecuencia_cardiaca}
    Frecuencia Respiratoria: ${vitales.frecuencia_respiratoria}
    Saturación O2: ${vitales.saturacion_oxigeno}
    Glasgow: ${vitales.glasgow}
    Dolor (0-10): ${vitales.dolor_escala}
    Glicemia Capilar: ${vitales.glicemia_capilar}

    ===== HALLAZGOS CLÍNICOS =====
    ${hallazgosClinicos || "No registrado"}

    ===== DIAGNÓSTICO PRESUNTIVO =====
    ${diagnosticoPresuntivo || "No registrado"}
      `.trim();
    };


  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const clinicalTxt = buildClinicalTXT();

      const response = await apiClient.createClinicalAttention({
        patient_id: patientId,
        resident_doctor_id: residentDoctorId,
        supervisor_doctor_id: supervisorDoctorId,
        diagnostic:clinicalTxt
        ,id_episodio: idEpisodio
      });

      if (response.success && response.data) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = `/clinical_attentions/details/${response.data.id}`;
        }, 1500);
      } else {
        setError(response.error || "Error al crear la atención clínica");
      }
    } catch (err) {
      setError("Error al crear la atención clínica");
    } finally {
      setLoading(false);
    }
  };

  const areVitalsFilled = Object.values(vitales).every(v => v !== "" && v !== null);

const isFormValid =
  patientId &&
  residentDoctorId &&
  supervisorDoctorId &&
  motivoConsulta &&
  anamnesis &&
  triage &&
  diagnosticoPresuntivo &&
  areVitalsFilled;


  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-health-text-muted">ID Episodio (opcional)</label>
        <input
          type="text"
          value={idEpisodio}
          onChange={(e) => setIdEpisodio(e.target.value)}
          placeholder=""
          className="rounded-lg bg-white border border-health-border px-3 py-2 text-health-text"
        />
        <p className="text-xs text-health-text-muted">
        </p>
      </div>
      {/* IDs */}
      <div className="grid gap-4 grid-cols-3">
        {/* Paciente */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-health-text-muted">Paciente *</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="rounded-lg bg-white border border-health-border px-3 py-2 text-health-text h-10"
            required
            disabled={patientsLoading}
          >
            <option value="">
              {patientsLoading ? "Cargando pacientes..." : "Selecciona un paciente"}
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {`${p.rut ? `${p.rut} — ` : ""}${p.first_name} ${p.last_name}`}
              </option>
            ))}
          </select>
        </div>

        {/* Residente */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-health-text-muted">Médico Residente *</label>
          <select
            value={residentDoctorId}
            onChange={(e) => setResidentDoctorId(e.target.value)}
            className="rounded-lg bg-white border border-health-border px-3 py-2 text-health-text h-10"
            required
            disabled={medicsLoading}
          >
            <option value="">
              {medicsLoading ? "Cargando médicos..." : "Selecciona un residente"}
            </option>
            {medics.resident.map((d) => (
              <option key={d.id} value={d.id}>
                {`${d.first_name} ${d.last_name}`}
              </option>
            ))}
          </select>
        </div>

        {/* Supervisor */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-health-text-muted">Médico Supervisor *</label>
          <select
            value={supervisorDoctorId}
            onChange={(e) => setSupervisorDoctorId(e.target.value)}
            className="rounded-lg bg-white border border-health-border px-3 py-2 text-health-text h-10"
            required
            disabled={medicsLoading}
          >
            <option value="">
              {medicsLoading ? "Cargando médicos..." : "Selecciona un supervisor"}
            </option>
            {medics.supervisor.map((d) => (
              <option key={d.id} value={d.id}>
                {`${d.first_name} ${d.last_name}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Errores */}
      {patientsError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-600">
          {patientsError}
        </div>
      )}
      {medicsError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-600">
          {medicsError}
        </div>
      )}
      {/* MOTIVO DE CONSULTA */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-white/70">Motivo de Consulta *</label>
        <textarea
          value={motivoConsulta}
          onChange={(e) => setMotivoConsulta(e.target.value)}
          className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 min-h-24"
          required
        />
      </div>

      {/* ANAMNESIS */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-health-text-muted">Anamnesis *</label>
        <textarea
          value={anamnesis}
          onChange={(e) => setAnamnesis(e.target.value)}
          className="rounded-lg bg-white border border-health-border px-3 py-2 min-h-32 text-health-text"
          required
        />
      </div>
      {/* TRIAGE */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Triage (1 = más grave) *</label>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTriage(n)}
                className={`
                  px-4 py-2 rounded-lg border transition font-semibold 
                  ${triage === n 
                    ? "bg-health-accent text-black border-health-accentDark" 
                    : "bg-black/40 text-white/70 border-white/10 hover:bg-black/60"}
                `}
              >
                {n}
              </button>
            ))}
          </div>

          {!triage && (
            <p className="text-xs text-red-400">Debes seleccionar un nivel de triage</p>
          )}
        </div>

      {/* SIGNOS VITALES */}
      <div className="space-y-3">
        <h3 className="text-health-text font-semibold">Signos Vitales</h3>

        <div className="grid grid-cols-3 gap-4">
          {[
            ["temperatura", "Temperatura (°C)"],
            ["presion_arterial_sistolica", "Presión Sistólica"],
            ["presion_arterial_diastolica", "Presión Diastólica"],
            ["frecuencia_cardiaca", "Frecuencia Cardíaca"],
            ["frecuencia_respiratoria", "Frecuencia Respiratoria"],
            ["saturacion_oxigeno", "Saturación O₂ (%)"],
            ["glasgow", "Glasgow"],
            ["dolor_escala", "Dolor (0-10)"],
            ["glicemia_capilar", "Glicemia Capilar"],
          ].map(([field, label]) => (
            <div key={field} className="flex flex-col gap-1">
              <label className="text-xs text-health-text-muted">{label}</label>
              <input
                type="number"
                value={vitales[field]}
                onChange={(e) => updateVital(field, e.target.value)}
                className="rounded-lg bg-white border border-health-border px-3 py-2 text-health-text"
              />

            </div>
          ))}
        </div>
      </div>

      {/* HALLAZGOS */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-health-text-muted">Hallazgos Clínicos</label>
        <textarea
          value={hallazgosClinicos}
          onChange={(e) => setHallazgosClinicos(e.target.value)}
          className="rounded-lg bg-white border border-health-border px-3 py-2 min-h-32 text-health-text"
        />
      </div>

      {/* DIAGNOSTICO */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-health-text-muted">Diagnóstico Presuntivo *</label>
        <textarea
          value={diagnosticoPresuntivo}
          onChange={(e) => setDiagnosticoPresuntivo(e.target.value)}
          className="rounded-lg bg-white border border-health-border px-3 py-2 min-h-32 text-health-text"
          required
        />
      </div>

      {/* INDICACIONES */}


      {/* Mensajes */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-600">
          ¡Atención clínica creada! Redirigiendo...
        </div>
      )}

      {/* BOTÓN */}
      <button
        type="submit"
        disabled={!isFormValid || loading}
        className={`w-full rounded-xl px-6 py-3 font-medium transition ${
          isFormValid && !loading
            ? "bg-health-accent text-white hover:bg-health-accent-dark"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? "Creando..." : "Crear Atención Clínica"}
      </button>
    </form>
  );
}
