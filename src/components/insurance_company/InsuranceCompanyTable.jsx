import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import AutocompleteSelect from "../admin/AutocompleteSelect";
import PaginatedTable from "../shared/PaginatedTable";
import Icon from "../UI/Icon";
import Tooltip from "../UI/Tooltip";
export default function InsuranceCompanyTable() {
  const [companies, setCompanies] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]); // For autocomplete selector
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
  const [uploading, setUploading] = useState(false);


  const handleDownloadTemplate = () => {
    // Create CSV template with headers and example data
    // Using comma-separated values with UTF-8 BOM for proper encoding
    const csvContent = `Episodio,Validación
1234567890,PERTINENTE
0987654321,NO PERTINENTE`;

    // Add UTF-8 BOM to ensure proper encoding
    const BOM = '\uFEFF';
    const contentWithBOM = BOM + csvContent;

    // Create blob and download as CSV file with UTF-8 encoding
    const blob = new Blob([contentWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'template_aseguradora.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    setUploading(true);

    try {
      const resp = await apiClient.uploadInsuranceExcel(selectedCompany, excelFile);

      if (resp.success && resp.data) {
        setUploadMessage(`Archivo procesado correctamente. Registros afectados: ${resp.data.updated}.`);
        // Clear the file input after successful upload
        setExcelFile(null);
        setSelectedCompany(null);
      } else {
        setUploadError(resp.error || "Error al procesar archivo.");
      }
    } catch (err) {
      setUploadError("Error inesperado al procesar el archivo.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  // Load all companies for the autocomplete selector (only once)
  useEffect(() => {
    const loadAllCompanies = async () => {
      try {
        const response = await apiClient.getInsuranceCompanies({
          page: 1,
          page_size: 200, // Max allowed by backend
        });
        if (response.success && response.data) {
          setAllCompanies(response.data.results);
        } else {
          console.error("Error loading companies for autocomplete:", response.error);
        }
      } catch (e) {
        console.error("Error loading all companies:", e);
      }
    };

    loadAllCompanies();
  }, []);

  // Load paginated companies for the table
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

  return (
    <div className="space-y-4">
            {/* SUBIR EXCEL DE ASEGURADORA */}
      {/* SUBIR EXCEL DE ASEGURADORA */}
<div className="flex flex-col md:flex-row gap-4 items-center md:items-end">

  {/* Selector Autocomplete */}
  <div className="flex flex-col w-full md:w-1/3">
    <label className="text-health-text-muted text-sm mb-1">
      Aseguradora {allCompanies.length === 0 && <span className="text-xs">(cargando...)</span>}
    </label>

    <AutocompleteSelect
      value={selectedCompany}
      onChange={(id) => setSelectedCompany(id)}
      options={allCompanies}
      placeholder={allCompanies.length === 0 ? "Cargando aseguradoras..." : "Selecciona una aseguradora..."}
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

  {/* Buttons */}
  <div className="flex gap-2 w-full md:w-auto">
    {/* Download Template Button */}
    <button
      onClick={handleDownloadTemplate}
      className="
        bg-white
        text-health-accent
        border border-health-accent
        font-semibold
        rounded-lg
        px-4 py-2
        hover:bg-gray-50
        transition
        shadow-md
        w-full md:w-auto
        flex items-center justify-center gap-2
      "
      title="Descargar plantilla CSV de ejemplo"
    >
      📥 Plantilla
    </button>

    {/* Upload Button */}
    <button
      onClick={handleExcelUpload}
      disabled={uploading}
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
        disabled:opacity-50
        disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      "
    >
      {uploading ? (
        <>
          <svg
            className="animate-spin h-5 w-5 text-white"
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
          Subiendo...
        </>
      ) : (
        <>⬆️ Subir Excel</>
      )}
    </button>
  </div>
</div>

      {/* Upload Messages */}
      {uploadMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded-lg border border-green-200 flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {uploadMessage}
        </div>
      )}

      {uploadError && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg border border-red-200">
          {uploadError}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm border border-blue-200">
        <strong>📝 Formato del archivo:</strong> El archivo Excel (.xlsx o .xls) debe contener las columnas{" "}
        <code className="bg-blue-100 px-1 rounded">Episodio</code> y{" "}
        <code className="bg-blue-100 px-1 rounded">Validación</code>.{" "}
        Los valores de Validación deben ser <code className="bg-blue-100 px-1 rounded">PERTINENTE</code> o{" "}
        <code className="bg-blue-100 px-1 rounded">NO PERTINENTE</code>.{" "}
        Columnas adicionales serán ignoradas. Descarga la plantilla de ejemplo.
      </div>

      <PaginatedTable
        columns={[
          {
            key: "rut",
            header: "RUT",
            render: (c) => c.rut || "—",
            cellClassName: "px-4 py-3 whitespace-nowrap"
          },
          {
            key: "nombre_comercial",
            header: "Nombre Comercial",
            render: (c) => c.nombre_comercial || "—"
          },
          { key: "nombre_juridico", header: "Razón Social" },
          {
            key: "actions",
            header: "",
            render: (c) => (
              <Tooltip text="Ver Detalles (editar)">
                <a
                  href={`/aseguradora/details/${c.id}`}
                  className="text-health-accent hover:underline"
                >
                  <Icon name="edit" />
                </a>
              </Tooltip>
            ),
            cellClassName: "px-4 py-3 text-right whitespace-nowrap"
          }
        ]}
        data={companies}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        loading={loading}
        error={error}
        emptyMessage="No hay aseguradoras registradas."
      />
    </div>
  );
}
