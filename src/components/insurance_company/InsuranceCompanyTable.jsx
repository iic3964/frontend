import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";

export default function InsuranceCompanyTable() {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    console.log("Rendering InsuranceCompanyTable");
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
        console.log("Loading insurance companies...");
      try {
        const response = await apiClient.getInsuranceCompanies({
          page: currentPage,
          page_size: pageSize,
        });
        console.log(response);
        if (response.success && response.data) {
          setCompanies(response.data.results);
          setTotal(response.data.total);
        } else {
          setError(response.error || "Error al cargar");
        }
      } catch (e) {
        setError("Error al cargar aseguradoras");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentPage, pageSize]);

  const totalPages = Math.ceil(total / pageSize);
  const startRecord = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, total);

  if (loading)
    return (
      <div className="py-12 flex justify-center text-white/70">Cargando...</div>
    );

  if (error)
    return (
      <div className="py-12 flex justify-center text-red-400">{error}</div>
    );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/30">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-white/80 [&>th]:whitespace-nowrap">
              <th>ID</th>
              <th>Nombre Comercial</th>
              <th>Razón Social</th>
              <th>RUT</th>
              <th></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="px-4 py-3">{c.id}</td>

                <td className="px-4 py-3">{c.nombre_comercial || "—"}</td>

                <td className="px-4 py-3">{c.nombre_juridico}</td>

                <td className="px-4 py-3">{c.rut || "—"}</td>

                <td className="px-4 py-3 text-right">
                  <a
                    href={`/aseguradora/details/${c.id}`}
                    className="text-health-accent hover:underline"
                  >
                    Ver más
                  </a>
                </td>
              </tr>
            ))}

            {companies.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-white/60"
                >
                  No hay aseguradoras registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex items-center justify-between text-sm text-white/70">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span>Registros por página:</span>
            <select
              className="rounded-lg bg-black/40 border border-white/10 px-3 py-1 outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(+e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value={2}>2</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>

          <p className="text-xs">
            Mostrando {startRecord}-{endRecord} de {total}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs">
            Página {currentPage} de {totalPages || 1}
          </span>

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50"
          >
            Anterior
          </button>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
