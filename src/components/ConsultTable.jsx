import { useEffect, useState } from "react";
import { apiClient } from "../modules/api";

export default function ConsultTable() {
  const [clinicalAttentions, setClinicalAttentions] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NUEVOS ESTADOS PARA EDICIÓN ---
  const [editingId, setEditingId] = useState(null);
  const [tempUrgencyLaw, setTempUrgencyLaw] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  // --- FUNCIONES PARA EDITAR LEY URGENCIA ---
  const startEditing = (record) => {
    setEditingId(record.id);
    setTempUrgencyLaw(record.applies_urgency_law);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setTempUrgencyLaw(null);
  };

  const saveUrgencyLaw = async (recordId) => {
    setIsSaving(true);
    try {
      const response = await apiClient.updateClinicalAttention(recordId, {
        applies_urgency_law: tempUrgencyLaw,
      });

      if (response.success) {
        // Actualizamos localmente para no recargar toda la tabla
        setClinicalAttentions((prev) =>
          prev.map((item) =>
            item.id === recordId
              ? { ...item, applies_urgency_law: tempUrgencyLaw }
              : item
          )
        );
        setEditingId(null);
      } else {
        alert("Error al actualizar");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <div className="space-y-4">
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
              <th>Validación Médico</th>
              <th>Validación Supervisor</th>
              <th>Médico Residente</th>
              <th>Supervisor</th>
              <th></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-health-border bg-white">
            {clinicalAttentions.map((r) => {
              const isPendingUrgencyLaw = r.ai_result !== true && r.ai_result !== false;
              const doesUrgencyLawApply = (r.ai_result === true && r.medic_approved === false) || (
                r.ai_result === false && r.medic_approved === true
              );

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

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-md px-2 py-1 text-xs ${
                        isPendingUrgencyLaw
                          ? "bg-gray-100 text-gray-600"
                          : doesUrgencyLawApply
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {
                        isPendingUrgencyLaw
                          ? "Pendiente"
                          : doesUrgencyLawApply
                            ? "Aplica"
                            : "No aplica"
                      }
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-md px-2 py-1 text-xs ${
                        r.applies_urgency_law === true
                          ? "bg-green-100 text-green-700"
                          : r.applies_urgency_law === false
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.applies_urgency_law === true
                        ? "Aplica"
                        : r.applies_urgency_law === false
                        ? "No aplica"
                        : "Pendiente"}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    Por implementar
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-md px-2 py-1 text-xs ${
                        r.ai_result && r.medic_approved === false ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.ai_result && r.medic_approved === false ? "Objetado" : "-"}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.resident_doctor.first_name}{" "}
                    {r.resident_doctor.last_name}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.supervisor_doctor.first_name}{" "}
                    {r.supervisor_doctor.last_name}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`/clinical_attentions/details/${r.id}`}
                      className="text-health-accent hover:underline"
                    >
                      Ver más
                    </a>
                  </td>
                </tr>
              );
            })}

            {clinicalAttentions.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-6 text-health-text-muted text-center"
                >
                  No hay registros.
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
