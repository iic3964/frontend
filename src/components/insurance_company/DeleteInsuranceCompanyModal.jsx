import { apiClient } from "../../modules/api";

export default function DeleteInsuranceCompanyModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}) {
  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      const resp = await apiClient.deleteInsuranceCompany(companyId);

      if (resp.success) {
        onSuccess();
        onClose();
      } else {
        alert("Error al eliminar: " + resp.error);
      }
    } catch (err) {
      alert("Error de conexión al eliminar.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h2 className="text-xl font-semibold text-red-400 mb-4">
          Confirmar eliminación
        </h2>

        <p className="text-white/80 mb-6 leading-relaxed">
          ¿Estás seguro de que deseas eliminar esta aseguradora?
          <br />
          <span className="text-white/50 text-sm">
            Esta acción no se puede deshacer.
          </span>
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-600/70 text-white hover:bg-red-600 transition shadow-lg shadow-red-600/20"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
