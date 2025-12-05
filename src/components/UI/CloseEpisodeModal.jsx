import { useState } from "react";

export default function CloseEpisodeModal({ isOpen, onClose, onConfirm }) {
  const [selectedReason, setSelectedReason] = useState("");

  const closingReasons = [
    { value: "Muerte", label: "Muerte" },
    { value: "Hospitalización", label: "Hospitalización" },
    { value: "Alta", label: "Alta" },
    { value: "Traslado", label: "Traslado" },
  ];

  const handleConfirm = () => {
    if (!selectedReason) {
      alert("Por favor seleccione una razón de cierre");
      return;
    }
    onConfirm(selectedReason);
    setSelectedReason("");
  };

  const handleCancel = () => {
    setSelectedReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Cerrar Episodio
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccione la razón de cierre:
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-health-accent focus:border-transparent"
          >
            <option value="">-- Seleccionar --</option>
            {closingReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-health-accent"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-health-accent rounded-md hover:bg-health-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-health-accent"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
