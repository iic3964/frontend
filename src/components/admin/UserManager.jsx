import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import Icon from "../UI/Icon";
import Tooltip from "../UI/Tooltip";

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

        // Combine all users. Backend sorts them by is_deleted ASC (active first)
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

  const handleToggleStatusClick = async (user) => {
    const isDeactivating = !user.is_deleted;
    const actionText = isDeactivating ? "desactivar" : "reactivar";
    const confirmMsg = isDeactivating
      ? `¿Estás seguro de que quieres desactivar a ${user.first_name} ${user.last_name}? El usuario no podrá iniciar sesión.`
      : `¿Quieres reactivar a ${user.first_name} ${user.last_name}?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let resp;
      if (isDeactivating) {
        resp = await apiClient.deleteUser(user.id); // Calls deactivate endpoint
      } else {
        resp = await apiClient.reactivateUser(user.id);
      }

      if (!resp.success) {
        throw new Error(resp.error || `Error al ${actionText} usuario`);
      }

      setSuccessMsg(`Usuario ${isDeactivating ? "desactivado" : "reactivado"} correctamente.`);
      await loadUsers();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || `Error al ${actionText} usuario`);
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
        if (!resp.success && resp.data) throw new Error({
          "User already registered": "El email ya está registrado.",
        }[resp.data.detail]);
        if (!resp.success) throw new Error(resp.error);

        setSuccessMsg("Usuario creado exitosamente.");
      } else {
        const { password, ...updatePayload } = formData;
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
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((u) => {
                    const isDeleted = u.is_deleted === true;
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-health-border transition
                          ${isDeleted
                            ? "bg-gray-100 text-gray-400"
                            : "hover:bg-gray-50"
                          }
                        `}
                      >
                        <td className="p-3">
                          {u.first_name} {u.last_name}
                        </td>
                        <td className="p-3">{u.email || "-"}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold
                                  ${
                                    isDeleted
                                      ? "bg-gray-200 text-gray-500"
                                      : u.role === "admin"
                                      ? "bg-purple-100 text-purple-700"
                                      : u.role === "supervisor"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                          >
                            {u.role === "admin"
                              ? "Jefe Servicio"
                              : u.role === "supervisor"
                              ? "Jefe de Turno"
                              : "Residente"}
                          </span>
                        </td>
                        <td className="p-3">
                           {isDeleted ? (
                             <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Inactivo</span>
                           ) : (
                             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Activo</span>
                           )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 items-center justify-end">
                            <Tooltip text="Editar">
                              <button
                                disabled={isDeleted}
                                onClick={() => handleEditClick(u)}
                                className={`${isDeleted ? 'text-gray-400' : 'cursor-pointer text-blue-600 hover:text-blue-700'} transition`}
                              >
                                <Icon name="edit" />
                              </button>
                            </Tooltip>

                            <Tooltip text={isDeleted ? "Reactivar" : "Desactivar"}>
                              <button
                                onClick={() => handleToggleStatusClick(u)}
                                className={`cursor-pointer font-medium transition
                                  ${isDeleted
                                    ? 'text-green-600 hover:text-green-700'
                                    : 'text-red-600 hover:text-red-700'
                                  }`}
                              >
                                <Icon name={isDeleted ? "check" : "ban"} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
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
                <option value="supervisor">Jefe de Turno</option>
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
