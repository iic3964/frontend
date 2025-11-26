import { useEffect, useState } from "react";
import { apiClient } from "../modules/api";

export default function SendForm() {
  const [patientId, setPatientId] = useState("");
  const [residentDoctorId, setResidentDoctorId] = useState("");
  const [supervisorDoctorId, setSupervisorDoctorId] = useState("");

  const [medics, setMedics] = useState({ resident: [], supervisor: [] });
  const [medicsLoading, setMedicsLoading] = useState(false);
  const [medicsError, setMedicsError] = useState(null);

  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState(null);

  // Campos clínicos
  const [anamnesis, setAnamnesis] = useState("");
  const [hallazgosClinicos, setHallazgosClinicos] = useState("");
  const [diagnosticoPresuntivo, setDiagnosticoPresuntivo] = useState("");
  const [indicaciones, setIndicaciones] = useState("");

  // 🔥 Signos vitales con valores normales
  const [vitales, setVitales] = useState({
    temperatura: 36.8,
    presion_arterial_sistolica: 120,
    presion_arterial_diastolica: 80,
    frecuencia_cardiaca: 80,
    frecuencia_respiratoria: 16,
    saturacion_oxigeno: 98,
    glasgow: 15,
    dolor_escala: 0,
    glicemia_capilar: 90,
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 🔥 Construcción del TXT clínico
  const buildClinicalTXT = () => {
    return `
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

  const isFormValid =
    patientId &&
    residentDoctorId &&
    supervisorDoctorId &&
    anamnesis &&
    diagnosticoPresuntivo;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* IDs */}
      <div className="grid gap-4 grid-cols-3">
        {/* Paciente */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Paciente *</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="rounded-lg bg-black/40 border border-white/10 px-3 py-2"
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
          <label className="text-sm text-white/70">Médico Residente *</label>
          <select
            value={residentDoctorId}
            onChange={(e) => setResidentDoctorId(e.target.value)}
            className="rounded-lg bg-black/40 border border-white/10 px-3 py-2"
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
          <label className="text-sm text-white/70">Médico Supervisor *</label>
          <select
            value={supervisorDoctorId}
            onChange={(e) => setSupervisorDoctorId(e.target.value)}
            className="rounded-lg bg-black/40 border border-white/10 px-3 py-2"
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
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-red-400">
          {patientsError}
        </div>
      )}
      {medicsError && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-red-400">
          {medicsError}
        </div>
      )}

      {/* ANAMNESIS */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-white/70">Anamnesis *</label>
        <textarea
          value={anamnesis}
          onChange={(e) => setAnamnesis(e.target.value)}
          className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 min-h-32"
          required
        />
      </div>

      {/* SIGNOS VITALES */}
      <div className="space-y-3">
        <h3 className="text-white/80 font-semibold">Signos Vitales</h3>

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
              <label className="text-xs text-white/60">{label}</label>
              <input
                type="number"
                value={vitales[field]}
                onChange={(e) => updateVital(field, e.target.value)}
                className="rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              />
            </div>
          ))}
        </div>
      </div>

      {/* HALLAZGOS */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-white/70">Hallazgos Clínicos</label>
        <textarea
          value={hallazgosClinicos}
          onChange={(e) => setHallazgosClinicos(e.target.value)}
          className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 min-h-32"
        />
      </div>

      {/* DIAGNOSTICO */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-white/70">Diagnóstico Presuntivo *</label>
        <textarea
          value={diagnosticoPresuntivo}
          onChange={(e) => setDiagnosticoPresuntivo(e.target.value)}
          className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 min-h-32"
          required
        />
      </div>

      {/* INDICACIONES */}
      

      {/* Mensajes */}
      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-3 text-green-300">
          ¡Atención clínica creada! Redirigiendo...
        </div>
      )}

      {/* BOTÓN */}
      <button
        type="submit"
        disabled={!isFormValid || loading}
        className={`w-full rounded-xl px-6 py-3 font-medium transition ${
          isFormValid && !loading
            ? "bg-health-accent text-black hover:bg-health-accentDark"
            : "bg-white/10 text-white/40 cursor-not-allowed"
        }`}
      >
        {loading ? "Creando..." : "Crear Atención Clínica"}
      </button>
    </form>
  );
}
