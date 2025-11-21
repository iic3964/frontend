import { useEffect, useState } from "react";
import { apiClient } from "../modules/api";

export default function ConsultTable() {
  const [clinicalAttentions, setClinicalAttentions] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/70">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/30">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-white/80 [&>th]:whitespace-nowrap">
              <th>Created At</th>
              <th>ID Episodio</th>
              <th>Nombre Paciente</th>
              <th>RUT</th>
              <th>Médico Residente</th>
              <th>Médico Supervisor</th>
              <th>Aprobado Por Medico</th>
              <th>Ley Urgencia</th>
              <th>Resultado IA</th>
              <th>Updated At</th>
              <th></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {clinicalAttentions.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(r.created_at)}
                </td>

                {/* NUEVA COLUMNA EPISODIO */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.id || "N/A"}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {r.patient.first_name} {r.patient.last_name}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">{r.patient.rut}</td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {r.resident_doctor.first_name} {r.resident_doctor.last_name}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {r.supervisor_doctor.first_name}{" "}
                  {r.supervisor_doctor.last_name}
                </td>
                 <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-md px-2 py-1 text-xs ${
                        r.medic_approved === true
                          ? "bg-green-500/20 text-green-400"     // Aprobado
                          : r.medic_approved === false
                          ? "bg-red-500/20 text-red-400"         // Rechazado
                          : "bg-white/10 text-white/70"          // Pendiente (null)
                      }`}
                    >
                      {r.medic_approved === true
                        ? "Aprobado"
                        : r.medic_approved === false
                        ? "Rechazado"
                        : "Pendiente"}
                    </span>
                  </td>
                

                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`rounded-md px-2 py-1 text-xs ${
                      r.applies_urgency_law === true
                        ? "bg-health-ok/20 text-health-ok"
                        : r.applies_urgency_law === false
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {r.applies_urgency_law === true
                      ? "Sí"
                      : r.applies_urgency_law === false
                      ? "No"
                      : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`rounded-md px-2 py-1 text-xs ${
                      r.ai_result === true
                        ? "bg-health-ok/20 text-health-ok"
                        : r.ai_result === false
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {r.ai_result === true
                      ? "Aplica"
                      : r.ai_result === false
                      ? "No Aplica"
                      : "Pendiente"}
                  </span>
                </td>

               


                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(r.updated_at)}
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
            ))}

            {clinicalAttentions.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-6 text-white/60 text-center"
                >
                  No hay registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-white/70">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span>Registros por página:</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="rounded-lg bg-black/40 border border-white/10 px-3 py-1 outline-none focus:ring-2 focus:ring-health-accent"
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
            className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 transition"
          >
            Anterior
          </button>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50 transition"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
