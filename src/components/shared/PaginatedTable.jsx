import { useState, useEffect } from "react";

/**
 * Reusable paginated table component
 *
 * @param {Array} columns - Array of column definitions: [{ key: string, header: string, render?: (item) => JSX }]
 * @param {Array} data - Array of data items to display
 * @param {number} total - Total number of items (for pagination)
 * @param {number} currentPage - Current page number
 * @param {number} pageSize - Number of items per page
 * @param {Function} onPageChange - Callback when page changes
 * @param {Function} onPageSizeChange - Callback when page size changes
 * @param {boolean} loading - Whether data is loading
 * @param {string} error - Error message to display
 * @param {string} emptyMessage - Message to show when no data
 * @param {Array} pageSizeOptions - Available page sizes (default: [10, 20, 50])
 */
export default function PaginatedTable({
  columns = [],
  data = [],
  total = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  loading = false,
  error = null,
  emptyMessage = "No hay registros.",
  pageSizeOptions = [10, 20, 50],
}) {
  const totalPages = Math.ceil(total / pageSize);
  const startRecord = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, total);

  const handlePageSizeChange = (newSize) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };

  const handlePageChange = (newPage) => {
    if (onPageChange && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-health-border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-health-text [&>th]:whitespace-nowrap">
              {columns.map((col, idx) => (
                <th key={col.key || idx} className={col.headerClassName}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-health-border bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-health-text-muted"
                >
                  Cargando...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-red-600"
                >
                  {error}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-6 text-health-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50 text-health-text">
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} className={col.cellClassName || "px-4 py-3"}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-sm text-health-text-muted">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span>Registros por página:</span>
            <select
              className="rounded-lg bg-white border border-health-border px-3 py-1 outline-none text-health-text"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(+e.target.value)}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
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
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3 py-1 rounded-lg bg-white border border-health-border hover:bg-gray-50 disabled:opacity-50 text-health-text"
          >
            Anterior
          </button>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-3 py-1 rounded-lg bg-white border border-health-border hover:bg-gray-50 disabled:opacity-50 text-health-text"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
