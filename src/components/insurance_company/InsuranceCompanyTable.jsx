import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import AutocompleteSelect from "../admin/AutocompleteSelect";
export default function InsuranceCompanyTable() {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    // Estados para la subida de Excel
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);


  const handleExcelUpload = async () => {
    setUploadMessage(null);
    setUploadError(null);

    if (!selectedCompany) {
      setUploadError("Selecciona una aseguradora.");
      return;
    }

    if (!excelFile) {
      setUploadError("Selecciona un archivo Excel (.xlsx).");
      return;
    }

    const resp = await apiClient.uploadInsuranceExcel(selectedCompany, excelFile);

    if (resp.success && resp.data) {
      setUploadMessage(`Archivo procesado correctamente. Registros afectados: ${resp.data.updated}.`);
    } else {
      setUploadError(resp.error || "Error al procesar archivo.");
    }
  };

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
      <div className="py-12 flex justify-center text-health-text-muted">Cargando...</div>
    );

  if (error)
    return (
      <div className="py-12 flex justify-center text-red-600">{error}</div>
    );

  return (
    <div className="space-y-4">
            {/* SUBIR EXCEL DE ASEGURADORA */}
      {/* SUBIR EXCEL DE ASEGURADORA */}
<div className="flex flex-col md:flex-row gap-4 items-center md:items-end">

  {/* Selector Autocomplete */}
  <div className="flex flex-col w-full md:w-1/3">
    <label className="text-health-text-muted text-sm mb-1">Aseguradora</label>

    <AutocompleteSelect
      value={selectedCompany}
      onChange={(id) => setSelectedCompany(id)}
      options={companies}
      placeholder="Selecciona una aseguradora..."
    />
  </div>

  {/* INPUT FILE custom */}
  <div className="flex flex-col w-full md:w-1/3">
    <label className="text-health-text-muted text-sm mb-1">Archivo Excel (.xlsx)</label>

    <label className="
      cursor-pointer
      bg-white hover:bg-gray-50
      border border-health-border
      rounded-lg
      px-4 py-2
      text-health-text
      text-sm
      flex items-center justify-between
    ">
      <span>{excelFile ? excelFile.name : "Elegir archivo..."}</span>
      <span className="text-health-accent font-bold">📎</span>
      <input
        type="file"
        className="hidden"
        accept=".xlsx"
        onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
      />
    </label>
  </div>

  {/* Botón subir */}
  <button
    onClick={handleExcelUpload}
    className="
      bg-health-accent
      text-white
      font-semibold
      rounded-lg
      px-5 py-2
      hover:bg-health-accent-dark
      transition
      shadow-md
      w-full md:w-auto
    "
  >
    ⬆️ Subir Excel
  </button>
</div>



      <div className="overflow-x-auto rounded-2xl border border-health-border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-health-text [&>th]:whitespace-nowrap">
              <th>ID</th>
              <th>Nombre Comercial</th>
              <th>Razón Social</th>
              <th>RUT</th>
              <th></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-health-border bg-white">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 text-health-text">
                <td className="px-4 py-3">{c.id}</td>

                <td className="px-4 py-3">{c.nombre_comercial || "—"}</td>

                <td className="px-4 py-3">{c.nombre_juridico}</td>

                <td className="px-4 py-3 whitespace-nowrap">{c.rut || "—"}</td>

                <td className="px-4 py-3 text-right whitespace-nowrap">
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
                  className="text-center py-6 text-health-text-muted"
                >
                  No hay aseguradoras registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex items-center justify-between text-sm text-health-text-muted">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span>Registros por página:</span>
            <select
              className="rounded-lg bg-white border border-health-border px-3 py-1 outline-none text-health-text"
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
            className="px-3 py-1 rounded-lg bg-white border border-health-border hover:bg-gray-50 disabled:opacity-50 text-health-text"
          >
            Anterior
          </button>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1 rounded-lg bg-white border border-health-border hover:bg-gray-50 disabled:opacity-50 text-health-text"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
