import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";

import EditInsuranceCompanyModal from "./EditInsuranceCompanyModal";
import DeleteInsuranceCompanyModal from "./DeleteInsuranceCompanyModal";

export default function InsuranceCompanyDetails({ id }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadCompany = async () => {
    try {
      const resp = await apiClient.getInsuranceCompany(id);
      if (resp.success) setCompany(resp.data);
      else setError("Error al cargar");
    } catch (e) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
  }, [id]);

  if (loading)
    return (
      <div className="py-20 text-center text-white/60">Cargando...</div>
    );

  if (error || !company)
    return (
      <div className="py-20 text-center text-red-400">{error}</div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <a
          href="/aseguradora"
          className="text-health-accent hover:underline text-sm"
        >
          ← Volver a la lista
        </a>

        <div className="flex gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-lg bg-health-accent text-black px-4 py-2 text-sm hover:bg-health-accent-dark shadow-md"
          >
            Editar
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm hover:bg-red-600 shadow-md"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* DATOS */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h2 className="text-lg font-semibold text-health-accent mb-4">
          Información de la aseguradora
        </h2>

        <ul className="space-y-2 text-white/80">
          <li>
            <span className="text-white/50">Nombre Comercial:</span>{" "}
            {company.nombre_comercial || "—"}
          </li>

          <li>
            <span className="text-white/50">Razón Social:</span>{" "}
            {company.nombre_juridico}
          </li>

          <li>
            <span className="text-white/50">RUT:</span>{" "}
            {company.rut || "—"}
          </li>
        </ul>
      </div>

      {/* MODALES */}
      <EditInsuranceCompanyModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        company={company}
        onSuccess={loadCompany}
      />

      <DeleteInsuranceCompanyModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        companyId={company.id}
        onSuccess={() => (window.location.href = "/aseguradora")}
      />
    </div>
  );
}
