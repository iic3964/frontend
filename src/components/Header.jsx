import { useState, useEffect } from "react";

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem("saluia.session");
    if (sessionStr) {
      setIsAuthenticated(!!sessionStr);
      try {
        const parsedSession = JSON.parse(sessionStr);
        setUserRole(parsedSession.user?.user_metadata?.role || null);
      } catch (e) {
        console.error("Error parsing session", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("saluia.session");
    window.location.href = "/auth/login";
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <header className="border-b border-white/10 bg-black/20 backdrop-blur relative z-40">
        <div className="mx-auto w-full xl:max-w-6xl px-4 py-4 flex items-center gap-3">
          <img src="/health.svg" alt="SaluIA" className="w-7 h-7" />
          <h1 className="font-semibold tracking-wide">SaluIA</h1>

          <nav className="ml-auto flex gap-4 text-sm">
            <a
              href="/"
              className="hover:text-health-accent transition-colors"
            >
              Inicio
            </a>
            {userRole === "admin" && (
            <a
              href="/aseguradora"
              className="hover:text-health-accent transition-colors"
            >
              Aseguradoras
            </a>
            )}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="hover:text-red-400 transition-colors text-left cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </nav>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0A0A0A] border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-white mb-2">
              ¿Cerrar sesión?
            </h3>
            <p className="text-white/60 text-sm mb-6">
              Serás redirigido al inicio de sesión.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
