import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import AutocompleteSelect from "../admin/AutocompleteSelect";

const PatientManager = () => {
  const [view, setView] = useState("list"); // 'list', 'create', 'edit', 'episode'
  const [patients, setPatients] = useState([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [clinicalHistory, setClinicalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    rut: "",
    first_name: "",
    last_name: "",
    mother_last_name: "",
    age: "",
    sex: "",
    height: "",
    weight: "",
    insurance_company_id: "",
  });

  useEffect(() => {
    loadPatients();
    loadInsuranceCompanies();
  }, []);

  const loadInsuranceCompanies = async () => {
    try {
      const resp = await apiClient.getInsuranceCompanies({ page_size: 200 });
      if (resp.success) {
        const items = resp.data.items || resp.data.results || [];
        setInsuranceCompanies(items);
      }
    } catch (err) {
      console.error("Error loading insurance companies:", err);
    }
  };

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.getPatients();
      if (resp.success && resp.data && Array.isArray(resp.data.patients)) {
        setPatients(resp.data.patients);
      } else {
        setError(resp.error || "Failed to load patients");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading patients");
    } finally {
      setLoading(false);
    }
  };

  const loadClinicalHistory = async (patientId) => {
    setLoadingHistory(true);
    try {
      const resp = await apiClient.getClinicalAttentionHistory({
        patient_ids: [patientId],
      });
      console.log("Clinical history response:", patientId);
      if (resp.success && resp.data && resp.data.patients.length > 0) {
        setClinicalHistory(resp.data.patients[0].attentions || []);
      } else {
        setClinicalHistory([]);
      }
    } catch (err) {
      console.error("Error loading clinical history:", err);
      setClinicalHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- Handlers ---

  const handleEditClick = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      rut: patient.rut || "",
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      mother_last_name: patient.mother_last_name || "",
      age: patient.age || "",
      sex: patient.sex || "",
      height: patient.height || "",
      weight: patient.weight || "",
      insurance_company_id: patient.insurance_company?.id || "",
    });
    setView("edit");
    loadClinicalHistory(patient.id);
  };

  const handleCreateClick = () => {
    setSelectedPatient(null);
    setFormData({
      rut: "",
      first_name: "",
      last_name: "",
      mother_last_name: "",
      age: "",
      sex: "",
      height: "",
      weight: "",
      insurance_company_id: "",
    });
    setView("create");
  };

  const handleQuickEpisodeClick = () => {
    setSelectedPatient(null);
    setView("episode");
  };

  const handlePatientEpisodeClick = () => {
    setView("episode");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // --- CLEAN PAYLOAD ---
      // Convert empty strings to null for numeric fields to avoid 422 errors
      const payload = { ...formData };
      
      const numericFields = ["age", "height", "weight", "insurance_company_id"];
      numericFields.forEach((field) => {
        if (payload[field] === "" || payload[field] === undefined) {
          payload[field] = null;
        } else {
          payload[field] = Number(payload[field]);
        }
      });

      // Handle Enum or strings that should be null if empty
      if (payload.sex === "") payload.sex = null;
      if (payload.mother_last_name === "") payload.mother_last_name = null;

      let resp;

      if (view === "create") {
        resp = await apiClient.createPatient(payload);
      } else {
        resp = await apiClient.updatePatient(selectedPatient.id, payload);
      }

      if (resp.success) {
        await loadPatients();
        setView("list");
      } else {
        setError(resp.error || "Error al guardar los cambios");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering Logic ---
  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${p.first_name} ${p.last_name} ${p.mother_last_name || ""}`.toLowerCase();
    return fullName.includes(query) || p.rut.toLowerCase().includes(query);
  });

  // --- Helper for Sex Display ---
  const formatSex = (sex) => {
    if (!sex) return "N/A";
    if (sex === "M") return "M";
    if (sex === "F") return "F";
    return "N/A";
  };

  // --- Renders ---

  if (loading && view === "list" && patients.length === 0)
    return <div className="text-health-text">Loading...</div>;

  return (
    <div className="bg-health-card p-6 rounded-xl border border-health-border text-health-text">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">
          {view === "list"
            ? "Listado de Pacientes"
            : view === "create"
            ? "Nuevo Paciente"
            : view === "edit"
            ? "Editar Paciente"
            : "Nuevo Episodio Clínico"}
        </h2>

        <div className="flex gap-3">
          {view === "list" && (
            <>
              <button
                onClick={handleQuickEpisodeClick}
                className="bg-gray-100 border border-health-border text-health-text px-4 py-2 rounded-lg hover:bg-gray-200 transition cursor-pointer"
              >
                + Crear Episodio
              </button>
              <button
                onClick={handleCreateClick}
                className="bg-health-accent text-white px-4 py-2 rounded-lg hover:bg-health-accent-dark transition cursor-pointer"
              >
                + Crear Paciente
              </button>
            </>
          )}
          {view !== "list" && (
            <button
              onClick={() => setView("list")}
              className="text-health-text-muted hover:text-health-text underline cursor-pointer"
            >
              Volver al listado
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 border border-red-200">{error}</div>
      )}

      {/* List View */}
      {view === "list" && (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-health-border rounded-lg p-3 text-health-text focus:outline-none focus:border-health-accent transition"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-health-border text-health-text-muted">
                  <th className="p-3">RUT</th>
                  <th className="p-3">Nombre Completo</th>
                  <th className="p-3">Sexo</th>
                  <th className="p-3">Aseguradora</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-health-border hover:bg-gray-50 transition"
                    >
                      <td className="p-3">{p.rut}</td>
                      <td className="p-3">
                        {`${p.first_name} ${p.last_name} ${p.mother_last_name || ""}`}
                      </td>
                      <td className="p-3">
                        <span className={`font-medium ${
                            p.sex === 'M' ? 'text-blue-600' : 
                            p.sex === 'F' ? 'text-pink-600' : 'text-gray-400'
                        }`}>
                            {formatSex(p.sex)}
                        </span>
                      </td>
                      <td className="p-3">
                        {p.insurance_company?.nombre_comercial ||
                          p.insurance_company?.nombre_juridico ||
                          "-"}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="text-blue-600 hover:text-blue-700 mr-3 cursor-pointer"
                        >
                          Editar/Ver
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-health-text-muted">
                      No se encontraron pacientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create/Edit Form */}
      {(view === "create" || view === "edit") && (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* RUT */}
            <div>
              <label className="block text-sm text-health-text-muted mb-1">RUT</label>
              <input
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                required
              />
            </div>

            {/* Aseguradora (Dropdown) */}
            <div>
              <label className="block text-sm text-health-text-muted mb-1">Aseguradora</label>
              <AutocompleteSelect
                value={formData.insurance_company_id}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, insurance_company_id: val }))
                }
                options={insuranceCompanies}
                placeholder="Selecciona una aseguradora..."
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm text-health-text-muted mb-1">Nombre</label>
              <input
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                required
              />
            </div>

            {/* Apellido Paterno */}
            <div>
              <label className="block text-sm text-health-text-muted mb-1">
                Apellido Paterno
              </label>
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                required
              />
            </div>

            {/* Apellido Materno */}
            <div>
              <label className="block text-sm text-health-text-muted mb-1">
                Apellido Materno
              </label>
              <input
                name="mother_last_name"
                value={formData.mother_last_name}
                onChange={handleInputChange}
                className="w-full bg-white border border-health-border rounded p-2 text-health-text"
              />
            </div>

            {/* Age / Height / Weight */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-health-text-muted mb-1">Edad</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                />
              </div>
              <div>
                <label className="block text-sm text-health-text-muted mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                />
              </div>
              <div>
                <label className="block text-sm text-health-text-muted mb-1">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                />
              </div>
            </div>

            {/* Sex Input for Editing/Creating */}
            <div>
                <label className="block text-sm text-health-text-muted mb-1">Sexo</label>
                <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                >
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino (M)</option>
                    <option value="F">Femenino (F)</option>
                </select>
            </div>

          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mb-8">
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-4 py-2 rounded text-health-text-muted hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-health-secondary hover:bg-purple-700 text-white font-medium"
            >
              {view === "create" ? "Crear Paciente" : "Guardar Cambios"}
            </button>
          </div>

          {/* Episodes Section */}
          {view === "edit" && (
            <div className="border-t border-white/20 pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Historial de Episodios Clínicos</h3>
                
              </div>

              {loadingHistory ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-health-text-muted border border-health-border">
                  <p>Cargando historial...</p>
                </div>
              ) : clinicalHistory.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-health-text-muted border border-health-border">
                  <p>No hay episodios clínicos registrados para este paciente.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse bg-white rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-100 border-b border-health-border text-health-text-muted text-sm">
                        <th className="p-3">ID Episodio</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Médico Residente</th>
                        <th className="p-3">Médico Supervisor</th>
                        <th className="p-3">Ley Urgencia</th>
                        <th className="p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinicalHistory.map((attention) => (
                        <tr
                          key={attention.id}
                          className="border-b border-health-border hover:bg-gray-50 transition"
                        >
                          <td className="p-3 text-sm">
                            {attention.id_episodio || "No Informado"}
                          </td>
                          <td className="p-3 text-sm">
                            {attention.created_at
                              ? new Date(attention.created_at).toLocaleDateString("es-CL", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </td>
                          <td className="p-3 text-sm">
                            {attention.resident_doctor_name || "-"}
                          </td>
                          <td className="p-3 text-sm">
                            {attention.supervisor_doctor_name || "-"}
                          </td>
                          <td className="p-3 text-sm">
                            {attention.applies_urgency_law === null ? (
                              <span className="text-gray-400">-</span>
                            ) : attention.applies_urgency_law ? (
                              <span className="text-green-600 font-semibold">Sí</span>
                            ) : (
                              <span className="text-red-600 font-semibold">No</span>
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            <a
                              href={`/clinical_attentions/details/${attention.id}`}
                              className="text-blue-600 hover:text-blue-700 font-medium underline"
                            >
                              Ver
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </form>
      )}

      
    </div>
  );
};

export default PatientManager;