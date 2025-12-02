import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";

const UserManager = () => {
  const [view, setView] = useState("list"); // 'list', 'create', 'edit'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.getMedics();
      if (resp.success && resp.data) {
        // Combine residents and supervisors into a single list with role property
        const residents = (resp.data.resident || []).map(u => ({ ...u, role: 'resident' }));
        const supervisors = (resp.data.supervisor || []).map(u => ({ ...u, role: 'supervisor' }));
        // Note: If you have an endpoint for admins, fetch and add them here too.

        setUsers([...supervisors, ...residents]);
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
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      role: user.role || "resident",
      password: "", // Password is not editable directly here usually
    });
    setView("edit");
  };

  const handleCreateClick = () => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "create") {
        const resp = await apiClient.registerUser(formData);
        if (!resp.success) throw new Error(resp.error);
      } else {
        // Update logic (excluding password)
        const { password, ...updatePayload } = formData;
        const resp = await apiClient.updateDoctor(selectedUser.id, updatePayload);
        if (!resp.success) throw new Error(resp.error);
      }

      await loadUsers();
      setView("list");
    } catch (err) {
      setError(err.message || "Error saving user");
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering Logic ---
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return fullName.includes(query) || (u.email && u.email.toLowerCase().includes(query));
  });

  // --- Renders ---

  if (loading && view === 'list' && users.length === 0) return <div className="text-health-text">Loading...</div>;

  return (
    <div className="bg-health-card p-6 rounded-xl border border-health-border text-health-text">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">
          {view === "list" ? "Gestión de Usuarios" : view === "create" ? "Nuevo Usuario" : "Editar Usuario"}
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
                onClick={() => setView("list")}
                className="text-health-text-muted hover:text-health-text underline"
            >
                Volver al listado
            </button>
            )}
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 border border-red-200">{error}</div>}

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

          <div className="overflow-x-auto">
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
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-health-border hover:bg-gray-50 transition">
                        <td className="p-3">{u.first_name} {u.last_name}</td>
                        <td className="p-3">{u.email || '-'}</td>
                        <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold
                                ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                  u.role === 'supervisor' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'}`}>
                                {u.role === 'admin' ? 'Jefe Servicio' : u.role === 'supervisor' ? 'Médico Jefe' : 'Residente'}
                            </span>
                        </td>
                        <td className="p-3">
                        <button
                            onClick={() => handleEditClick(u)}
                            className="text-blue-600 hover:text-blue-700 mr-3 cursor-pointer"
                        >
                            Editar
                        </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="p-4 text-center text-health-text-muted">
                            No se encontraron usuarios.
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
          <div className="grid grid-cols-1 gap-4 mb-6">

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-health-text-muted mb-1">Nombre</label>
                    <input name="first_name" value={formData.first_name} onChange={handleInputChange} className="w-full bg-white border border-health-border rounded p-2 text-health-text" required />
                </div>
                <div>
                    <label className="block text-sm text-health-text-muted mb-1">Apellido</label>
                    <input name="last_name" value={formData.last_name} onChange={handleInputChange} className="w-full bg-white border border-health-border rounded p-2 text-health-text" required />
                </div>
            </div>

            <div>
              <label className="block text-sm text-health-text-muted mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-white border border-health-border rounded p-2 text-health-text" required />
            </div>

            {view === "create" && (
              <div>
                <label className="block text-sm text-health-text-muted mb-1">Contraseña</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full bg-white border border-health-border rounded p-2 text-health-text" required />
                <p className="text-xs text-health-text-muted mt-1">La contraseña es requerida para crear el usuario.</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-health-text-muted mb-1">Rol</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-white border border-health-border rounded p-2 text-health-text h-10">
                <option value="resident">Médico Residente</option>
                <option value="supervisor">Médico Jefe</option>
                <option value="admin">Jefe de Servicio (Admin)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mb-8">
            <button type="button" onClick={() => setView("list")} className="px-4 py-2 rounded text-health-text-muted hover:bg-gray-100 cursor-pointer">Cancelar</button>
            <button type="submit" className="px-6 py-2 rounded bg-health-secondary hover:bg-purple-700 text-white font-medium cursor-pointer">
              {view === "create" ? "Crear Usuario" : "Guardar Cambios"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserManager;
