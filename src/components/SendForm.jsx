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

    // load both in parallel
    loadMedics();
    loadPatients();

    return () => {
      mounted = false;
    };
  }, []);
  const [diagnostic, setDiagnostic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.createClinicalAttention({
        patient_id: patientId,
        resident_doctor_id: residentDoctorId,
        supervisor_doctor_id: supervisorDoctorId,
        diagnostic: diagnostic,
      });

      if (response.success && response.data) {
        setSuccess(true);
        // Redirigir al detalle después de 1.5 segundos
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

  const isFormValid = patientId && residentDoctorId && supervisorDoctorId && diagnostic;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* IDs en una sola línea */}
      <div className="grid gap-4 grid-cols-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Paciente *</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
            required
            disabled={patientsLoading}
          >
            <option value="">{patientsLoading ? "Cargando pacientes..." : "Selecciona un paciente"}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {`${p.rut ? `${p.rut} — ` : ""}${p.first_name} ${p.last_name}${p.email ? ` — ${p.email}` : ""}`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Médico Residente *</label>
          <select
            value={residentDoctorId}
            onChange={(e) => setResidentDoctorId(e.target.value)}
            className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
            required
            disabled={medicsLoading}
          >
            <option value="">{medicsLoading ? "Cargando médicos..." : "Selecciona un médico residente"}</option>
            {medics.resident.map((d) => (
              <option key={d.id} value={d.id}>
                {`${d.first_name} ${d.last_name}${d.email ? ` — ${d.email}` : d.phone ? ` — ${d.phone}` : ""}`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Médico Supervisor *</label>
          <select
            value={supervisorDoctorId}
            onChange={(e) => setSupervisorDoctorId(e.target.value)}
            className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent"
            required
            disabled={medicsLoading}
          >
            <option value="">{medicsLoading ? "Cargando médicos..." : "Selecciona un médico supervisor"}</option>
            {medics.supervisor.map((d) => (
              <option key={d.id} value={d.id}>
                {`${d.first_name} ${d.last_name}${d.email ? ` — ${d.email}` : d.phone ? ` — ${d.phone}` : ""}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Medics fetch error */}
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

      {/* Diagnóstico */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-white/70">Diagnóstico *</label>
        <textarea
          value={diagnostic}
          onChange={(e) => setDiagnostic(e.target.value)}
          className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-health-accent min-h-32"
          placeholder="Describe el diagnóstico del paciente..."
          required
        />
      </div>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-health-ok/20 border border-health-ok/50 px-4 py-3 text-health-ok">
          ¡Atención clínica creada exitosamente! Redirigiendo...
        </div>
      )}

      {/* Botón enviar */}
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
