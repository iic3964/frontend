import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";

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

  // --- FILTERS STATE ---
  const [filters, setFilters] = useState({
    patient: "", // Name or RUT
    doctor: "", // Dynamic doctor search
    status: "all", // Resident Status: "all", "pending", "approved", "rejected"
    supervisorStatus: "all", // Supervisor Status: "all", "pending" (null), "approved" (true), "rejected" (false)
  });

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
        }
      }
    } catch (e) {
      console.error("Error leyendo sesión:", e);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getClinicalAttentions({
          page: currentPage,
          page_size: pageSize,
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

    fetchData();
  }, [currentPage, pageSize]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL", {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const normalize = (text) => (text ? text.toLowerCase().trim() : "");

  const filteredData = clinicalAttentions.filter((item) => {
    // 1. Role-based filtering (Data Access)
    if (userRole && userRole !== "admin") {
      const myNameNormalized = normalize(userFullName);
      
      if (userRole === "resident") {
        const residentName = `${item.resident_doctor?.first_name || ""} ${item.resident_doctor?.last_name || ""}`;
        if (normalize(residentName) !== myNameNormalized) return false;
      }
      
      if (userRole === "supervisor") {
        const supervisorName = `${item.supervisor_doctor?.first_name || ""} ${item.supervisor_doctor?.last_name || ""}`;
        if (normalize(supervisorName) !== myNameNormalized) return false;
      }
    }

    // 2. Search Filters
    if (filters.patient) {
      const search = normalize(filters.patient);
      const pName = normalize(`${item.patient.first_name} ${item.patient.last_name}`);
      const pRut = normalize(item.patient.rut);
      if (!pName.includes(search) && !pRut.includes(search)) {
        return false;
      }
    }

    if (filters.doctor) {
      const search = normalize(filters.doctor);
      
      if (userRole === "resident") {
        const supName = normalize(`${item.supervisor_doctor?.first_name} ${item.supervisor_doctor?.last_name}`);
        if (!supName.includes(search)) return false;
      
      } else if (userRole === "supervisor") {
        const resName = normalize(`${item.resident_doctor?.first_name} ${item.resident_doctor?.last_name}`);
        if (!resName.includes(search)) return false;
      
      } else if (userRole === "admin") {
        const resName = normalize(`${item.resident_doctor?.first_name} ${item.resident_doctor?.last_name}`);
        const supName = normalize(`${item.supervisor_doctor?.first_name} ${item.supervisor_doctor?.last_name}`);
        
        if (!resName.includes(search) && !supName.includes(search)) return false;
      }
    }

    // 3. Status Filter (Resident)
    if (filters.status !== "all") {
      if (filters.status === "pending" && item.medic_approved !== null) return false;
      if (filters.status === "approved" && item.medic_approved !== true) return false;
      if (filters.status === "rejected" && item.medic_approved !== false) return false;
    }

    // 4. Status Filter (Supervisor) - NEW
    if (filters.supervisorStatus !== "all") {
      // "pending" represents "Sin observaciones" (null)
      if (filters.supervisorStatus === "pending" && item.supervisor_approved !== null) return false;
      if (filters.supervisorStatus === "approved" && item.supervisor_approved !== true) return false;
      if (filters.supervisorStatus === "rejected" && item.supervisor_approved !== false) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(total / pageSize);
  const startRecord = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, total);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

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

  return (
    <div className="space-y-6">
      
      {/* --- FILTER BAR --- */}
      <div className="bg-white p-4 rounded-2xl border border-health-border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Patient Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-health-text-muted font-medium">Paciente (Nombre o RUT)</label>
          <input 
            type="text" 
            placeholder="Ej: Juan Pérez o 12.345..."
            value={filters.patient}
            onChange={(e) => setFilters(prev => ({ ...prev, patient: e.target.value }))}
            className="border border-health-border rounded-lg px-3 py-2 text-sm text-health-text outline-none focus:ring-1 focus:ring-health-accent"
          />
        </div>

        {/* Doctor Filter (Dynamic) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-health-text-muted font-medium">{doctorFilterLabel}</label>
          <input 
            type="text" 
            placeholder="Nombre del médico..."
            value={filters.doctor}
            onChange={(e) => setFilters(prev => ({ ...prev, doctor: e.target.value }))}
            className="border border-health-border rounded-lg px-3 py-2 text-sm text-health-text outline-none focus:ring-1 focus:ring-health-accent"
          />
        </div>

        {/* Resident Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-health-text-muted font-medium">
             Estado Validación Residente
          </label>
          <select 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border border-health-border rounded-lg px-3 py-2 text-sm text-health-text outline-none focus:ring-1 focus:ring-health-accent bg-white"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Validado (Aprobado)</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>

        {/* Supervisor Status Filter (NEW) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-health-text-muted font-medium">
             Estado Validación Supervisor
          </label>
          <select 
            value={filters.supervisorStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, supervisorStatus: e.target.value }))}
            className="border border-health-border rounded-lg px-3 py-2 text-sm text-health-text outline-none focus:ring-1 focus:ring-health-accent bg-white"
          >
            <option value="all">Todos</option>
            <option value="pending">Sin observaciones</option>
            <option value="approved">Ratificado</option>
            <option value="rejected">Objetado</option>
          </select>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="overflow-x-auto rounded-2xl border border-health-border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-health-text [&>th]:whitespace-nowrap">
              <th>Fecha</th>
              <th># Episodio</th>
              <th>Nombre Paciente</th>
              <th>RUT</th>
              <th>Ley Urgencia</th>
              <th>Análisis IA</th>
              <th>Validación Residente</th>
              <th>Validación Supervisor</th>

              {userRole !== "resident" && <th>Médico Residente</th>}

              {userRole !== "supervisor" && <th>Supervisor</th>}

              <th></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-health-border bg-white">
            {filteredData.map((r) => {
              // --- LOGIC CALCULATIONS ---
              
              const isResidentApproved = r.medic_approved === true;
              const isResidentRejected = r.medic_approved === false;
              const isPendingValidation = r.medic_approved === null;

              // Supervisor Status Logic
              const isSupervisorObjected = r.supervisor_approved === false;
              const isSupervisorRatified = r.supervisor_approved === true;
              // If null, it means "Sin observaciones" (Default OK)

              // Calculate Effective Urgency Law Status based on rules
              let urgencyLawApplies = null; 

              if (isPendingValidation) {
                urgencyLawApplies = null; // Yellow/Pending
              } else if (isResidentApproved) {
                // Resident Approved -> Matches AI (Standard logic)
                urgencyLawApplies = r.ai_result;
              } else if (isResidentRejected) {
                // Resident Rejected -> Opposite of AI
                urgencyLawApplies = !r.ai_result;
              }

              return (
                <tr key={r.id} className="hover:bg-gray-50 text-health-text">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(r.created_at)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis">
                    {r.id_episodio || "No informado"}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.patient.first_name} {r.patient.last_name}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.patient.rut}
                  </td>

                   {/* --- LEY URGENCIA COLUMN --- */}
                   <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        urgencyLawApplies === true
                          ? "bg-green-100 text-green-700"
                          : urgencyLawApplies === false
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {urgencyLawApplies === true
                        ? "Aplica"
                        : urgencyLawApplies === false
                        ? "No aplica"
                        : "Pendiente"}
                    </span>
                  </td>

                  {/* AI Result */}
                  <td className="px-4 py-3 whitespace-nowrap">
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
                  </td>

                  {/* Validación Residente */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        isResidentApproved
                          ? "bg-green-100 text-green-700"
                          : isResidentRejected
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {isResidentApproved
                        ? "Aprobado"
                        : isResidentRejected
                        ? "Rechazado"
                        : "Pendiente"}
                    </span>
                  </td>

                  {/* Validación Supervisor (Gestión por Excepción) */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        isSupervisorObjected
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : isSupervisorRatified
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : "text-gray-400"
                      }`}
                    >
                      {isSupervisorObjected
                        ? "Objetado"
                        : isSupervisorRatified
                        ? "Ratificado"
                        : "Sin observaciones"}
                    </span>
                  </td>

                  {userRole !== "resident" && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.resident_doctor?.first_name}{" "}
                      {r.resident_doctor?.last_name}
                    </td>
                  )}

                  {userRole !== "supervisor" && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.supervisor_doctor?.first_name}{" "}
                      {r.supervisor_doctor?.last_name}
                    </td>
                  )}

                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`/clinical_attentions/details/${r.id}`}
                      className="text-health-accent hover:underline font-medium"
                    >
                      Ver más
                    </a>
                  </td>
                </tr>
              );
            })}

            {filteredData.length === 0 && (
              <tr>
                <td
                  colSpan={userRole === "admin" ? 11 : 10}
                  className="px-4 py-6 text-health-text-muted text-center"
                >
                   {clinicalAttentions.length > 0
                    ? "No se encontraron resultados con estos filtros."
                    : "No hay registros disponibles."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-health-text-muted">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span>Registros por página:</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="rounded-lg bg-white border border-health-border px-3 py-1 outline-none focus:ring-2 focus:ring-health-accent text-health-text"
            >
              <option value={2}>2</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>

          <p className="text-xs">
            Mostrando {startRecord}-{endRecord} de {total} registros
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs">
            Página {currentPage} de {totalPages || 1}
          </span>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-white border border-health-border hover:bg-gray-50 disabled:opacity-50 transition text-health-text"
          >
            Anterior
          </button>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 rounded-lg bg-white border border-health-border hover:bg-gray-50 disabled:opacity-50 transition text-health-text"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}