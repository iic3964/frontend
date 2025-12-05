import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import PaginatedTable from "../shared/PaginatedTable";
import CloseEpisodeModal from "../UI/CloseEpisodeModal";
import Icon from "../UI/Icon";
import Tooltip from "../UI/Tooltip";
import { parseClinicalSummary } from "./Detail";

export default function ConsultTable() {
  const [clinicalAttentions, setClinicalAttentions] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Session State
  const [userRole, setUserRole] = useState(null);
  const [userFullName, setUserFullName] = useState("");
  const [userId, setUserId] = useState(null);

  // Close Episode Modal State
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [episodeToClose, setEpisodeToClose] = useState(null);

  // --- FILTERS STATE ---
  const [filters, setFilters] = useState({
    patient: "",
    doctor: "",
    status: "all",
    supervisorStatus: "all",
  });

  // Debounced filter values
  const [debouncedPatient, setDebouncedPatient] = useState("");
  const [debouncedDoctor, setDebouncedDoctor] = useState("");

  // Track if filters are currently debouncing
  const isPatientDebouncing = filters.patient !== debouncedPatient;
  const isDoctorDebouncing = filters.doctor !== debouncedDoctor;

  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem("saluia.session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const meta = session.user?.user_metadata;

        if (meta) {
          const role = meta.role;
          const fullName = `${meta.first_name || ""} ${
            meta.last_name || ""
          }`.trim();

          setUserRole(role);
          setUserFullName(fullName);
          setUserId(session.user?.id);
        }
      }
    } catch (e) {
      console.error("Error leyendo sesión:", e);
    }
  }, []);

  // Debounce patient filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPatient(filters.patient);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.patient]);

  // Debounce doctor filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDoctor(filters.doctor);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.doctor]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedPatient, debouncedDoctor, filters.status, filters.supervisorStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getClinicalAttentions({
        page: currentPage,
        page_size: pageSize,
        patient_search: debouncedPatient || undefined,
        doctor_search: debouncedDoctor || undefined,
        medic_approved: filters.status !== "all" ? filters.status : undefined,
        supervisor_approved: filters.supervisorStatus !== "all" ? filters.supervisorStatus : undefined,
        current_user_id: userId || undefined,
      });

      if (response.success && response.data) {
        setClinicalAttentions(response.data.results);
        setTotal(response.data.total);
      } else {
        setError(response.error || "Error al cargar los datos");
      }
    } catch (err) {
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [currentPage, pageSize, debouncedPatient, debouncedDoctor, filters.status, filters.supervisorStatus, userId]);

  // --- INLINE EDIT HANDLER FOR PERTINENCIA ---
  const handlePertinenciaChange = async (id, newValue) => {
    // Optimistic Update
    const previousData = [...clinicalAttentions];
    setClinicalAttentions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, pertinencia: newValue } : item
      )
    );

    try {
      const response = await apiClient.updateClinicalAttention(id, {
        pertinencia: newValue,
      });

      if (!response.success) {
        // Revert on error
        setClinicalAttentions(previousData);
        alert("Error al actualizar pertinencia");
      }
    } catch (e) {
      setClinicalAttentions(previousData);
      alert("Error de conexión");
    }
  };

  // --- CLOSE/REOPEN HANDLERS ---
  const handleCloseEpisode = (episodeId) => {
    if (!userId) {
      alert("Error: No se pudo obtener el ID del usuario");
      return;
    }
    setEpisodeToClose(episodeId);
    setCloseModalOpen(true);
  };

  const handleConfirmClose = async (closingReason) => {
    try {
      const response = await apiClient.closeEpisode(episodeToClose, userId, closingReason);
      if (response.success) {
        alert("Episodio cerrado exitosamente");
        fetchData(); // Refresh the table
      } else {
        alert(response.error || "Error al cerrar el episodio");
      }
    } catch (e) {
      alert("Error de conexión al cerrar el episodio");
    } finally {
      setCloseModalOpen(false);
      setEpisodeToClose(null);
    }
  };

  const handleReopenEpisode = async (episodeId) => {
    if (!userId) {
      alert("Error: No se pudo obtener el ID del usuario");
      return;
    }

    if (!confirm("¿Está seguro que desea reabrir este episodio?")) {
      return;
    }

    try {
      const response = await apiClient.reopenEpisode(episodeId, userId);
      if (response.success) {
        alert("Episodio reabierto exitosamente");
        fetchData(); // Refresh the table
      } else {
        alert(response.error || "Error al reabrir el episodio");
      }
    } catch (e) {
      alert("Error de conexión al reabrir el episodio");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL", {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  // Client-side filtering removed - now handled by server-side filtering


  if (loading && clinicalAttentions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-health-text-muted">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  let doctorFilterLabel = "Buscar Médico";
  if (userRole === "resident") doctorFilterLabel = "Buscar Supervisor";
  else if (userRole === "supervisor") doctorFilterLabel = "Buscar Residente";
  else if (userRole === "admin") doctorFilterLabel = "Buscar Médico (Res. o Sup.)";

  // Build columns array dynamically based on userRole
  const columns = [
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center space-x-2">
          <Tooltip text="Ver Detalle">
            <a
              href={`/clinical_attentions/details/${r.id}`}
              className="text-health-accent hover:text-health-accent-dark"
            >
              <Icon name="edit" />
            </a>
          </Tooltip>

          {!r.is_closed && (
            <Tooltip text="Cerrar Episodio">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleCloseEpisode(r.id);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <Icon name="lock" />
              </button>
            </Tooltip>
          )}

          {r.is_closed && userRole === "admin" && (
            <Tooltip text="Reabrir Episodio">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleReopenEpisode(r.id);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <Icon name="unlock" />
              </button>
            </Tooltip>
          )}
        </div>
      ),
      cellClassName: "px-0 pl-2 py-3 whitespace-nowrap"
    },
    {
      key: "closed_status",
      header: "Estado",
      render: (r) => {
        if (r.is_closed) {
          return (
            <Tooltip text={r.closing_reason || "Sin razón especificada"}>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700">
                <Icon name="lock" className="mr-1 w-3 h-3" />
                Cerrado
              </span>
            </Tooltip>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
            <Icon name="unlock" className="mr-1 w-3 h-3" />
            Abierto
          </span>
        );
      },
      cellClassName: "pl-4 py-3 whitespace-nowrap"
    },
    {
      key: "created_at",
      header: "Fecha",
      render: (r) => formatDate(r.created_at),
      cellClassName: "pl-4 py-3 whitespace-nowrap"
    },
    {
      key: "id_episodio",
      header: "# Episodio",
      render: (r) => r.id_episodio || "-",
      cellClassName: "px-4 py-3 whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis"
    },
    {
      key: "patient_name",
      header: "Nombre Paciente",
      render: (r) => `${r.patient.first_name} ${r.patient.last_name}`,
      cellClassName: "px-4 py-3 whitespace-nowrap"
    },
    {
      key: "triage",
      header: "Triage",
      render: (r) => parseClinicalSummary(r.diagnostic)?.triage || "-",
      cellClassName: "px-4 py-3 whitespace-nowrap"
    },
    {
      key: "urgency_law",
      header: "Ley Urgencia",
      render: (r) => {
        const doesUrgencyLawApply = r.applies_urgency_law;

        return (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              doesUrgencyLawApply === true
                ? "bg-green-100 text-green-700"
                : doesUrgencyLawApply === false
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {doesUrgencyLawApply === true
              ? "Aplica"
              : doesUrgencyLawApply === false
              ? "No aplica"
              : "Pendiente"}
          </span>
        );
      },
      headerClassName: "!px-1",
      cellClassName: "px-1 py-3 whitespace-nowrap"
    },
    {
      key: "ai_result",
      header: "IA",
      render: (r) => (
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            r.ai_result === true
              ? "bg-green-100 text-green-700"
              : r.ai_result === false
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {r.ai_result === true
            ? "Aplica"
            : r.ai_result === false
            ? "No aplica"
            : "Pendiente"}
        </span>
      ),
      headerClassName: "!px-1 text-center",
      cellClassName: "px-1 py-3 whitespace-nowrap"
    },
    {
      key: "resident_validation",
      header: "Residente",
      render: (r) => {
        const isResidentApproved = r.medic_approved === true;
        const isResidentRejected = r.medic_approved === false;
        return (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              isResidentApproved
                ? "bg-gray-100 text-gray-700"
                : isResidentRejected
                ? "bg-blue-100 text-blue-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {isResidentApproved
              ? "Aprobado"
              : isResidentRejected
              ? "Rechazado"
              : "Pendiente"}
          </span>
        );
      },
      headerClassName: "!px-1",
      cellClassName: "px-1 py-3 whitespace-nowrap"
    },
    {
      key: "supervisor_validation",
      header: "Supervisor",
      render: (r) => {
        const isSupervisorObjected = r.supervisor_approved === false;
        const isSupervisorRatified = r.supervisor_approved === true;
        return (
          <span
            className={`rounded-md py-1 text-xs font-medium ${
              isSupervisorObjected
                ? "px-2 border bg-blue-100 text-blue-700 border-blue-200"
                : isSupervisorRatified
                ? " px-2 bg-gray-100 text-gray-700"
                : "text-gray-400"
            }`}
          >
            {isSupervisorObjected
              ? "Objetado"
              : isSupervisorRatified
              ? "Ratificado"
              : "Sin obs."}
          </span>
        );
      },

      headerClassName: "!px-1",
      cellClassName: "px-1 py-3 whitespace-nowrap"
    },
  {
      key: "pertinencia",
      header: "Pertinencia",
      render: (r) => {
        const doesUrgencyLawApply = r.applies_urgency_law;

        if (!doesUrgencyLawApply) return null;

        if (userRole === "admin") {

          return (
            <select
              value={r.pertinencia === null ? "pending" : r.pertinencia ? "true" : "false"}
              onChange={(e) => {
                const val = e.target.value;
                const newValue = val === "pending" ? null : val === "true";
                handlePertinenciaChange(r.id, newValue);
              }}
              className={`rounded-md px-2 py-1 text-xs font-bold border cursor-pointer outline-none transition-colors appearance-none pr-6 bg-no-repeat bg-right
                ${
                  r.pertinencia === true
                  ? "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    : r.pertinencia === false
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                }`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundSize: "1.25em" }}
            >
              <option value="true">Pertinente</option>
              <option value="false">No Pertinente</option>
              <option value="pending">Pendiente</option>
            </select>
          );
        } else {
          return (
            <span
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                r.pertinencia === true
                ? "bg-gray-100 text-gray-600"
                : r.pertinencia === false
                ? "bg-blue-50 text-blue-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {r.pertinencia === true
                ? "Pertinente"
                : r.pertinencia === false
                ? "No Pertinente"
                : "Pendiente"}
            </span>
          );
        }
      },
      cellClassName: "px-4 py-3 whitespace-nowrap"
    },
  ];

  // Add resident doctor column if not a resident
  if (userRole !== "resident") {
    columns.push({
      key: "resident_doctor",
      header: "Médico Residente",
      render: (r) => `${r.resident_doctor?.first_name || ""} ${r.resident_doctor?.last_name || ""}`,
      cellClassName: "px-4 py-3 whitespace-nowrap"
    });
  }

  // Add supervisor column if not a supervisor
  if (userRole !== "supervisor") {
    columns.push({
      key: "supervisor_doctor",
      header: "Supervisor",
      render: (r) => `${r.supervisor_doctor?.first_name || ""} ${r.supervisor_doctor?.last_name || ""}`,
      cellClassName: "px-4 py-3 whitespace-nowrap"
    });
  }

  return (
    <div className="space-y-6">
      {/* Close Episode Modal */}
      <CloseEpisodeModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={handleConfirmClose}
      />

      {/* --- FILTER BAR --- */}
      <div className="bg-white p-4 rounded-2xl border border-health-border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Patient Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-health-text-muted font-medium">Paciente (Nombre o RUT)</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej: Juan Pérez o 12.345..."
              value={filters.patient}
              onChange={(e) => setFilters(prev => ({ ...prev, patient: e.target.value }))}
              className="w-full border border-health-border rounded-md px-3 py-2 text-sm text-health-text outline-none focus:ring-1 focus:ring-health-accent"
            />
            {isPatientDebouncing && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-health-accent border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Filter (Dynamic) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-health-text-muted font-medium">{doctorFilterLabel}</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nombre del médico..."
              value={filters.doctor}
              onChange={(e) => setFilters(prev => ({ ...prev, doctor: e.target.value }))}
              className="w-full border border-health-border rounded-md px-3 py-2 text-sm text-health-text outline-none focus:ring-1 focus:ring-health-accent"
            />
            {isDoctorDebouncing && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-health-accent border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Resident Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-health-text-muted font-medium">
             Estado Validación Residente
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border border-health-border h-9.5 px-3 py-2 text-sm text-health-text outline-none focus:ring-1 focus:ring-health-accent bg-white"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Validado (Aprobado)</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>

        {/* Supervisor Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-health-text-muted font-medium">
             Estado Validación Supervisor
          </label>
          <select
            value={filters.supervisorStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, supervisorStatus: e.target.value }))}
            className="border border-health-border h-9.5 rounded-lg px-3 py-2 text-sm text-health-text outline-none focus:ring-1 focus:ring-health-accent bg-white"
          >
            <option value="all">Todos</option>
            <option value="pending">Sin observaciones</option>
            <option value="approved">Ratificado</option>
            <option value="rejected">Objetado</option>
          </select>
        </div>
      </div>

      {/* --- TABLE --- */}
      <PaginatedTable
        columns={columns}
        data={clinicalAttentions}
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
        emptyMessage="No se encontraron resultados con estos filtros."
        pageSizeOptions={[2, 10, 20, 50]}
      />
    </div>
  );
}
