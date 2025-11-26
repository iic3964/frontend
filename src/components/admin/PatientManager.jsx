import React, { useState, useEffect } from "react";
import { apiClient } from "../../modules/api";

const PatientManager = () => {
  const [view, setView] = useState("list"); // 'list', 'create', 'edit', 'episode'
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
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
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.getPatients();
      if (resp.success && resp.data && Array.isArray(resp.data.patients)) {
        setPatients(resp.data.patients);
      } else {
        setError(resp.error || "Failed to load patients");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading patients");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleEditClick = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      rut: patient.rut || "",
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      mother_last_name: patient.mother_last_name || "",
      age: patient.age || "",
      sex: patient.sex || "",
      height: patient.height || "",
      weight: patient.weight || "",
      aseguradora: patient.aseguradora || "",
    });
    setView("edit");
  };

  const handleCreateClick = () => {
    setSelectedPatient(null);
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
    });
    setView("create");
  };

  const handleQuickEpisodeClick = () => {
    setSelectedPatient(null); // No patient pre-selected
    setView("episode");
  };

  const handlePatientEpisodeClick = () => {
    // selectedPatient is already set from the edit view
    setView("episode");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let resp;

      if (view === "create") {
        // Llama al método createPatient
        resp = await apiClient.createPatient(formData);
      } else {
        // Llama al método updatePatient
        resp = await apiClient.updatePatient(selectedPatient.id, formData);
      }

      if (resp.success) {
        // Recargar lista y volver
        await loadPatients();
        setView("list");
      } else {
        setError(resp.error || "Error al guardar los cambios");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering Logic ---
  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${p.first_name} ${p.last_name} ${
      p.mother_last_name || ""
    }`.toLowerCase();
    return fullName.includes(query) || p.rut.toLowerCase().includes(query);
  });

  // --- Renders ---

  if (loading && view === "list" && patients.length === 0)
    return <div className="text-white">Loading...</div>;

  return (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">
          {view === "list"
            ? "Listado de Pacientes"
            : view === "create"
            ? "Nuevo Paciente"
            : view === "edit"
            ? "Editar Paciente"
            : "Nuevo Episodio Clínico"}
        </h2>

        <div className="flex gap-3">
          {view === "list" && (
            <>
              <button
                onClick={handleQuickEpisodeClick}
                className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition cursor-pointer"
              >
                + Crear Episodio
              </button>
              <button
                onClick={handleCreateClick}
                className="bg-health-accent text-black px-4 py-2 rounded-lg hover:bg-health-accentDark transition cursor-pointer"
              >
                + Crear Paciente
              </button>
            </>
          )}
          {view !== "list" && (
            <button
              onClick={() => setView("list")}
              className="text-white/70 hover:text-white underline cursor-pointer"
            >
              Volver al listado
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <>
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-health-accent transition"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/60">
                  <th className="p-3">RUT</th>
                  <th className="p-3">Nombre Completo</th>
                  <th className="p-3">Aseguradora</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="p-3">{p.rut}</td>
                      <td className="p-3">{`${p.first_name} ${p.last_name} ${
                        p.mother_last_name || ""
                      }`}</td>
                      <td className="p-3">{p.aseguradora || "-"}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="text-blue-400 hover:text-blue-300 mr-3 cursor-pointer"
                        >
                          Editar/Ver
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-white/40">
                      No se encontraron pacientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create/Edit Form */}
      {(view === "create" || view === "edit") && (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-white/60 mb-1">RUT</label>
              <input
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded p-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Aseguradora
              </label>
              <input
                name="aseguradora"
                value={formData.aseguradora}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Nombre</label>
              <input
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded p-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Apellido Paterno
              </label>
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded p-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Apellido Materno
              </label>
              <input
                name="mother_last_name"
                value={formData.mother_last_name}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded p-2 text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-white/60 mb-1">Edad</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded p-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mb-8">
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-4 py-2 rounded text-white/70 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              {view === "create" ? "Crear Paciente" : "Guardar Cambios"}
            </button>
          </div>

          {/* Episodes Section (Only in Edit Mode) */}
          {view === "edit" && (
            <div className="border-t border-white/20 pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Episodios Clínicos</h3>
                <button
                  type="button"
                  onClick={handlePatientEpisodeClick}
                  className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition cursor-pointer"
                >
                  + Nuevo Episodio
                </button>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center text-white/50">
                <p>No hay episodios recientes (Implementar listado aquí)</p>
              </div>
            </div>
          )}
        </form>
      )}

      {/* WIP: Episode Creation View */}
      {view === "episode" && (
        <div className="max-w-2xl mx-auto p-10 bg-white/5 border border-dashed border-white/30 rounded-xl text-center">
          <h3 className="text-2xl font-semibold mb-4">
            Crear Nuevo Episodio (WIP)
          </h3>

          <div className="mb-6">
            <label className="block text-sm text-white/60 mb-2">
              Paciente Seleccionado:
            </label>
            {selectedPatient ? (
              <div className="bg-health-accent/20 border border-health-accent text-health-accent px-4 py-2 rounded">
                {selectedPatient.first_name} {selectedPatient.last_name} (
                {selectedPatient.rut})
              </div>
            ) : (
              <select className="w-full bg-white/10 border border-white/20 rounded p-2 text-white">
                <option value="">-- Seleccionar Paciente --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.rut})
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-white/50 italic">
            El formulario completo de registro de episodios clínicos se
            implementará aquí.
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientManager;
