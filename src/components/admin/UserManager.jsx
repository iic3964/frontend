import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";

const UserManager = () => {
  const [view, setView] = useState("list"); // 'list', 'create', 'edit'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "resident", // default
    password: "", // Only for create
  });

  useEffect(() => {
    loadUsers();
  }, []);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.getUsers();
      if (resp.success && resp.data) {
        const residents = (resp.data.resident || []).map((u) => ({
          ...u,
          role: "resident",
        }));
        const supervisors = (resp.data.supervisor || []).map((u) => ({
          ...u,
          role: "supervisor",
        }));
        const admins = (resp.data.admin || []).map((u) => ({
          ...u,
          role: "admin",
        }));
        setUsers([...admins, ...supervisors, ...residents]);
      } else {
        setError(resp.error || "Failed to load users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading users");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleEditClick = (user) => {
    setSuccessMsg(null);
    setError(null);
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      role: user.role || "resident",
      password: "",
    });
    setView("edit");
  };

  const handleCreateClick = () => {
    setSuccessMsg(null);
    setError(null);
    setSelectedUser(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      role: "resident",
      password: "",
    });
    setView("create");
  };

  const handleDeleteClick = async (user) => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres eliminar a ${user.first_name} ${user.last_name}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const resp = await apiClient.deleteUser(user.id);
      if (!resp.success) {
        throw new Error(resp.error || "Error eliminando usuario");
      }

      setSuccessMsg("Usuario eliminado correctamente.");
      await loadUsers();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al eliminar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (view === "create") {
        const payload = {
          first: formData.first_name,
          last: formData.last_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };

        const resp = await apiClient.registerUser(payload);
        if (!resp.success) throw new Error(resp.error);

        setSuccessMsg("Usuario creado exitosamente.");
      } else {
        const { password, ...updatePayload } = formData;
        // Ensure we send only the fields that were modified or required
        const resp = await apiClient.updateUser(selectedUser.id, updatePayload);
        if (!resp.success) throw new Error(resp.error);

        setSuccessMsg("Usuario actualizado exitosamente.");
      }

      await loadUsers();
      setView("list");

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error saving user");
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering & Pagination Logic ---

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return (
      fullName.includes(query) ||
      (u.email && u.email.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // --- Renders ---

  if (loading && view === "list" && users.length === 0)
    return <div className="text-health-text">Loading...</div>;

  return (
    <div className="bg-health-card p-6 rounded-xl border border-health-border text-health-text">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">
          {view === "list"
            ? "Gestión de Usuarios"
            : view === "create"
            ? "Nuevo Usuario"
            : "Editar Usuario"}
        </h2>

        <div className="flex gap-3">
          {view === "list" && (
            <button
              onClick={handleCreateClick}
              className="bg-health-accent text-white px-4 py-2 rounded-lg hover:bg-health-accent-dark transition cursor-pointer"
            >
              + Crear Usuario
            </button>
          )}
          {view !== "list" && (
            <button
              onClick={() => {
                setView("list");
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-health-text-muted hover:text-health-text underline"
            >
              Volver al listado
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4 border border-green-200 flex items-center animate-in fade-in slide-in-from-top-2 duration-300">
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
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 border border-red-200">
          {error}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-health-border rounded-lg p-3 text-health-text focus:outline-none focus:border-health-accent transition"
            />
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-health-border text-health-text-muted">
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-health-border hover:bg-gray-50 transition"
                    >
                      <td className="p-3">
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="p-3">{u.email || "-"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold
                                ${
                                  u.role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : u.role === "supervisor"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                        >
                          {u.role === "admin"
                            ? "Jefe Servicio"
                            : u.role === "supervisor"
                            ? "Médico Jefe"
                            : "Residente"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(u)}
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-4 text-center text-health-text-muted"
                    >
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredUsers.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className=" cursor-pointer px-3 py-1 rounded border border-health-border text-health-text-muted hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => handlePageChange(number)}
                    className={` cursor-pointer w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors
                            ${
                              currentPage === number
                                ? "bg-health-accent text-white"
                                : "text-health-text hover:bg-gray-100"
                            }`}
                  >
                    {number}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="cursor-pointer px-3 py-1 rounded border border-health-border text-health-text-muted hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Form */}
      {(view === "create" || view === "edit") && (
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto animate-in fade-in duration-300"
        >
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-health-text-muted mb-1">
                  Nombre
                </label>
                <input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-health-text-muted mb-1">
                  Apellido
                </label>
                <input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-health-text-muted mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                required
              />
            </div>

            {view === "create" && (
              <div>
                <label className="block text-sm text-health-text-muted mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-health-border rounded p-2 text-health-text"
                  required
                />
                <p className="text-xs text-health-text-muted mt-1">
                  La contraseña es requerida para crear el usuario.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm text-health-text-muted mb-1">
                Rol
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full bg-white border border-health-border rounded p-2 text-health-text h-10"
              >
                <option value="resident">Médico Residente</option>
                <option value="supervisor">Médico Jefe</option>
                <option value="admin">Jefe de Servicio (Admin)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mb-8">
            <button
              type="button"
              onClick={() => {
                setView("list");
                setError(null);
              }}
              className="px-4 py-2 rounded text-health-text-muted hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded bg-health-secondary hover:bg-purple-700 text-white font-medium cursor-pointer disabled:opacity-50"
            >
              {loading
                ? "Guardando..."
                : view === "create"
                ? "Crear Usuario"
                : "Guardar Cambios"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserManager;
