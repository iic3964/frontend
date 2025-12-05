import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";

export default function PatientModal({ isOpen, onClose, onSuccess, existingPatient = null }) {
  const [formData, setFormData] = useState({
    rut: "",
    first_name: "",
    last_name: "",
    mother_last_name: "",
    age: "",
    sex: "",
    height: "",
    weight: "",
    aseguradora: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [insuranceLoading, setInsuranceLoading] = useState(false);

  const isEditMode = !!existingPatient;

  // Load insurance companies when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadInsuranceCompanies = async () => {
        setInsuranceLoading(true);
        try {
          const response = await apiClient.getInsuranceCompanies({ page: 1, page_size: 1000 });
          if (response.success && response.data?.results) {
            setInsuranceCompanies(response.data.results);
          }
        } catch (err) {
          console.error("Error loading insurance companies:", err);
        } finally {
          setInsuranceLoading(false);
        }
      };
      loadInsuranceCompanies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (existingPatient) {
      setFormData({
        rut: existingPatient.rut || "",
        first_name: existingPatient.first_name || "",
        last_name: existingPatient.last_name || "",
        mother_last_name: existingPatient.mother_last_name || "",
        age: existingPatient.age?.toString() || "",
        sex: existingPatient.sex || "",
        height: existingPatient.height?.toString() || "",
        weight: existingPatient.weight?.toString() || "",
        aseguradora: existingPatient.aseguradora || "",
        email: existingPatient.email || "",
        phone: existingPatient.phone || "",
        address: existingPatient.address || "",
        city: existingPatient.city || "",
        state: existingPatient.state || "",
        zip: existingPatient.zip || "",
        country: existingPatient.country || "",
      });
    } else {
      setFormData({
        rut: "",
        first_name: "",
        last_name: "",
        mother_last_name: "",
        age: "",
        sex: "",
        height: "",
        weight: "",
        aseguradora: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      });
    }
    setError(null);
  }, [existingPatient, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data with proper types
      const payload = {
        rut: formData.rut,
        first_name: formData.first_name,
        last_name: formData.last_name,
        mother_last_name: formData.mother_last_name || undefined,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        sex: formData.sex || undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        aseguradora: formData.aseguradora || undefined,
      };

      let response;
      if (isEditMode) {
        response = await apiClient.updatePatient(existingPatient.id, payload);
      } else {
        response = await apiClient.createPatient(payload);
      }

      if (response.success) {
        onSuccess(response.data);
        onClose();
      } else {
        setError(response.error || `Error al ${isEditMode ? "actualizar" : "crear"} el paciente`);
      }
    } catch (err) {
      setError(`Error de conexión al ${isEditMode ? "actualizar" : "crear"} el paciente`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditMode ? "Actualizar Datos del Paciente" : "Crear Nuevo Paciente"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Personal Information Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
              Información Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  RUT *
                </label>
                <input
                  type="text"
                  value={formData.rut}
                  onChange={(e) => handleChange("rut", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  required
                  placeholder="12.345.678-9"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  required
                  placeholder="Juan"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  required
                  placeholder="Pérez"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  value={formData.mother_last_name}
                  onChange={(e) => handleChange("mother_last_name", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="González"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Edad
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="45"
                  min="0"
                  max="150"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Sexo
                </label>
                <select
                  value={formData.sex}
                  onChange={(e) => handleChange("sex", e.target.value)}
                  className="w-full h-9.5 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent bg-white"
                >
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
              Información Médica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="170"
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="70"
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Aseguradora
                </label>
                <select
                  value={formData.aseguradora}
                  onChange={(e) => handleChange("aseguradora", e.target.value)}
                  className="w-full h-9.5 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent bg-white"
                  disabled={insuranceLoading}
                >
                  <option value="">
                    {insuranceLoading ? "Cargando aseguradoras..." : "Seleccionar aseguradora"}
                  </option>
                  {insuranceCompanies.map((company) => (
                    <option key={company.id} value={company.nombre_comercial || company.nombre_juridico}>
                      {company.nombre_comercial || company.nombre_juridico}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
              Información de Contacto
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="Calle 123, Comuna"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="Santiago"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Región/Estado
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="Región Metropolitana"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => handleChange("zip", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="8320000"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  País
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-health-accent"
                  placeholder="Chile"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-health-accent rounded-md hover:bg-health-accent-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading
                ? isEditMode
                  ? "Actualizando..."
                  : "Creando..."
                : isEditMode
                ? "Actualizar Paciente"
                : "Crear Paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
