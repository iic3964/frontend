import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import AutocompleteSelect from "../admin/AutocompleteSelect";
import PaginatedTable from "../shared/PaginatedTable";
import Icon from "../UI/Icon";
import Tooltip from "../UI/Tooltip";

const PatientManager = () => {
  const [view, setView] = useState("list"); // 'list', 'create', 'edit', 'episode'
  const [patients, setPatients] = useState([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [clinicalHistory, setClinicalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Pagination for clinical history
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load patients when debounced search, page, or page size changes
  useEffect(() => {
    loadPatients();
  }, [currentPage, pageSize, debouncedSearch]);

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== searchQuery) return; // Only reset when debounce completes
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Load insurance companies once on mount
  useEffect(() => {
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
      const resp = await apiClient.getPatients({
        page: currentPage,
        page_size: pageSize,
        search: debouncedSearch || undefined,
      });
      console.log("Patients API response:", resp);
      if (resp.success && resp.data) {
        console.log("Patients results:", resp.data.results);
        setPatients(resp.data.results);
        setTotal(resp.data.total);
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
      console.log("Loading clinical history for patient:", patientId);
      const resp = await apiClient.getClinicalAttentionHistory({
        patient_ids: [patientId],
      });
      console.log("Clinical history API response:", resp);
      if (resp.success && resp.data && resp.data.patients.length > 0) {
        const attentions = resp.data.patients[0].attentions || [];
        console.log("Setting clinical history:", attentions.length, "episodes");
        setClinicalHistory(attentions);
      } else {
        console.log("No clinical history found or API error");
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

  // Pagination for clinical history
  const historyTotal = clinicalHistory.length;
  const historyStartIndex = (historyPage - 1) * historyPageSize;
  const historyEndIndex = historyStartIndex + historyPageSize;
  const paginatedHistory = clinicalHistory.slice(historyStartIndex, historyEndIndex);

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
            <button
              onClick={handleCreateClick}
              className="bg-health-accent text-white px-4 py-2 rounded-lg hover:bg-health-accent-dark transition cursor-pointer"
            >
              + Crear Paciente
            </button>
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
          {/* Search Bar */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-health-border rounded-lg px-4 py-2 pr-10 text-health-text focus:outline-none focus:border-health-accent transition"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="animate-spin h-5 w-5 text-health-accent"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
          </div>

          <PaginatedTable
            columns={[
              {
                key: "rut",
                header: "RUT",
                render: (p) => p.rut
              },
              {
                key: "name",
                header: "Nombre Completo",
                render: (p) => `${p.first_name} ${p.last_name} ${p.mother_last_name || ""}`
              },
              {
                key: "sex",
                header: "Sexo",
                render: (p) => (
                  <span className={`font-medium ${
                    p.sex === 'M' ? 'text-blue-600' :
                    p.sex === 'F' ? 'text-pink-600' : 'text-gray-400'
                  }`}>
                    {formatSex(p.sex)}
                  </span>
                )
              },
              {
                key: "age",
                header: "Edad",
                render: (u) => (u.age !== null && u.age !== undefined ? u.age : "N/A")
              },
              {
                key: "weight",
                header: "Peso (kg)",
                render: (u) => (u.weight !== null && u.weight !== undefined ? u.weight : "N/A")
              },
              {
                key: "height",
                header: "Altura (cm)",
                render: (u) => (u.height !== null && u.height !== undefined ? u.height : "N/A")
              },
              {
                key: "episodes_count",
                header: "# Episodios",
                render: (u) => u.episodes_count || 0
              },
              {
                key: "actions",
                header: "",
                render: (u) => (
                  <Tooltip text="Ver Detalles (editar)">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Icon name="edit" />
                    </button>
                  </Tooltip>
                )
              }
            ]}
            data={patients}
            total={total}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            loading={loading}
            error={null}
            emptyMessage="No se encontraron pacientes."
            pageSizeOptions={[10, 20, 50]}
          />
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
                    className="w-full h-10 bg-white border border-health-border rounded p-2 text-health-text"
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

              <PaginatedTable
                columns={[
                  {
                    key: "id_episodio",
                    header: "# Episodio",
                    render: (attention) => attention.id_episodio || "-",
                    cellClassName: "px-4 py-3 text-sm"
                  },
                  {
                    key: "created_at",
                    header: "Fecha",
                    render: (attention) => attention.created_at
                      ? new Date(attention.created_at).toLocaleDateString("es-CL", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "-",
                    cellClassName: "px-4 py-3 text-sm"
                  },
                  {
                    key: "urgency",
                    header: "Ley Urgencia",
                    render: (attention) => {
                      if (attention.applies_urgency_law === null) {
                        return <span className="text-gray-400">-</span>;
                      }
                      return attention.applies_urgency_law ? (
                        <span className="text-green-600 font-semibold">Sí</span>
                      ) : (
                        <span className="text-red-600 font-semibold">No</span>
                      );
                    },
                    cellClassName: "px-4 py-3 text-sm"
                  },
                  {
                    key: "actions",
                    header: "Acciones",
                    render: (attention) => (
                      <a
                        href={`/clinical_attentions/details/${attention.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Ver
                      </a>
                    ),
                    cellClassName: "px-4 py-3 text-sm"
                  }
                ]}
                data={paginatedHistory}
                total={historyTotal}
                currentPage={historyPage}
                pageSize={historyPageSize}
                onPageChange={(page) => setHistoryPage(page)}
                onPageSizeChange={(size) => {
                  setHistoryPageSize(size);
                  setHistoryPage(1);
                }}
                loading={loadingHistory}
                error={null}
                emptyMessage="No hay episodios clínicos registrados para este paciente."
                pageSizeOptions={[5]}
              />
            </div>
          )}
        </form>
      )}


    </div>
  );
};

export default PatientManager;
