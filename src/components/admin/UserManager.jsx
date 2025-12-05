import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import Icon from "../UI/Icon";
import Tooltip from "../UI/Tooltip";

const UserManager = () => {
  const [view, setView] = useState("list"); // 'list', 'create', 'edit'
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load users when debounced search, page, or page size changes
  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, debouncedSearch]);

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== searchQuery) return; // Only reset when debounce completes
    setCurrentPage(1);
  }, [debouncedSearch]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.getUsers({
        page: currentPage,
        page_size: pageSize,
        search: debouncedSearch || undefined,
      });
      if (resp.success && resp.data) {
        setUsers(resp.data.results);
        setTotal(resp.data.total);
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

  // --- Pagination Logic ---

  const totalPages = Math.ceil(total / pageSize);
  const startRecord = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, total);

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
          {/* Search Bar */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-health-border rounded-lg px-4 py-2 pr-10 text-health-text focus:outline-none focus:border-health-accent transition"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="animate-spin h-5 w-5 text-health-accent"
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
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-health-border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-health-text [&>th]:whitespace-nowrap">
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-health-border bg-white">
                {users.length > 0 ? (
                  users.map((u) => {
                    const isDeleted = u.is_deleted === true;
                    return (
                      <tr
                        key={u.id}
                        className={`transition
                          ${isDeleted
                            ? "bg-gray-100 text-gray-400"
                            : "hover:bg-gray-50 text-health-text"
                          }
                        `}
                      >
                        <td className="px-4 py-3">
                          {u.first_name} {u.last_name}
                        </td>
                        <td className="px-4 py-3">{u.email || "-"}</td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
                           {isDeleted ? (
                             <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Inactivo</span>
                           ) : (
                             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Activo</span>
                           )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
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
                      className="text-center py-6 text-health-text-muted"
                    >
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-sm text-health-text-muted mt-4">
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
