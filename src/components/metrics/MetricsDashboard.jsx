import { useEffect, useState } from "react";
import { apiClient } from "../../modules/api";
import MetricCard, { MetricCardWithProgress } from "./MetricCard.jsx";

/**
 * MetricsDashboard - Dashboard de métricas individuales
 */
export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("Usuario");
  const [userRole, setUserRole] = useState("");

  // Filtros de fecha
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchMetrics = async (userId, start, end) => {
    setLoading(true);
    try {
      const resp = await apiClient.getUserMetrics(userId, start, end);
      if (resp.success && resp.data) {
        setMetrics(resp.data);
      } else {
        setError("Error al cargar métricas");
      }
    } catch (e) {
      console.error(e);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem("saluia.session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const userId = session.user?.id;
        const role = session.user?.user_metadata?.role || "resident";
        const firstName = session.user?.user_metadata?.first_name || "";
        const lastName = session.user?.user_metadata?.last_name || "";

        setUserName(`${firstName} ${lastName}`.trim() || "Usuario");
        setUserRole(role);

        if (userId) {
          fetchMetrics(userId, startDate, endDate);
        }
      }
    } catch (error) {
      console.error("Error loading user session:", error);
      setError("Error de sesión");
      setLoading(false);
    }
  }, [startDate, endDate]);

  const handleDateFilterChange = (period) => {
    const now = new Date();
    let start = "";
    let end = now.toISOString().split("T")[0];

    if (period === "month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split("T")[0];
    } else if (period === "quarter") {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      start = d.toISOString().split("T")[0];
    } else if (period === "year") {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().split("T")[0];
    } else {
      // All time
      start = "";
      end = "";
    }

    setStartDate(start);
    setEndDate(end);
  };

  const roleLabels = {
    resident: "Médico Residente",
    supervisor: "Jefe de Turno",
    admin: "Jefe de Servicio",
  };

  if (loading && !metrics) {
    return (
      <div className="text-health-text-muted text-center py-8">
        Cargando métricas...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-health-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-health-text mb-1">
            Tus Métricas Personales
          </h2>
          <p className="text-health-text-muted text-sm">
            {userName} • {roleLabels[userRole] || "Médico"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-health-text-muted">Período:</span>
          <select
            className="bg-white border border-health-border rounded-lg px-3 py-2 text-sm text-health-text outline-none focus:ring-2 focus:ring-health-accent"
            onChange={(e) => handleDateFilterChange(e.target.value)}
            defaultValue="all"
          >
            <option value="all">Histórico (Todo)</option>
            <option value="month">Último mes</option>
            <option value="quarter">Último trimestre</option>
            <option value="year">Último año</option>
          </select>
        </div>
      </div>

      {/* 3 CARDS SUPERIORES: GENERALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Episodios Subidos"
          value={metrics.total_episodes}
          subtitle="Total general"
          theme="info"
          icon="📋"
        />
        <MetricCard
          title="Ley de Urgencia (Total)"
          value={metrics.total_urgency_law}
          subtitle="Médico o IA confirmaron urgencia"
          theme="warning"
          icon="🚨"
        />
        {/* 1. % Rechazo Ley Urgencia General */}
        <MetricCardWithProgress
          title="% Rechazo (Ley Urgencia General)"
          value={metrics.percent_urgency_law_rejected}
          subtitle="De todos los casos marcados como urgencia"
          theme={
            metrics.percent_urgency_law_rejected < 15 ? "success" : "danger"
          }
        />
      </div>

      {/* 4 CARDS INFERIORES: RIESGO / RECHAZO */}
      <div className="bg-white border border-health-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-health-text mb-4">
          Indicadores de Rechazo y Discrepancia
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <MetricCard
            title="IA dijo SÍ / Médico dijo SÍ"
            value={metrics.total_ai_yes}
            subtitle="Casos detectados por IA"
            theme="highlight"
            icon="🤖"
          />

          {/* 2. % Rechazo (IA dijo SI) */}
          <MetricCardWithProgress
            title="% Rechazo (IA dijo SÍ / Médico dijo SÍ)"
            value={metrics.percent_ai_yes_rejected}
            subtitle="Tasa de rechazo por aseguradoras"
            theme={metrics.percent_ai_yes_rejected < 15 ? "success" : "danger"}
          />

          {/* 3. IA No / Médico Sí (Cantidad) */}
          <MetricCard
            title="IA dijo NO / Médico dijo SÍ"
            value={metrics.total_ai_no_medic_yes}
            subtitle="Casos rescatados por el criterio médico"
            theme="default"
            icon="👨‍⚕️"
          />

          {/* 4. % Rechazo (IA No / Med Sí) */}
          <MetricCardWithProgress
            title="% Rechazo (IA dijo NO / Médico dijo SÍ)"
            value={metrics.percent_ai_no_medic_yes_rejected}
            subtitle="Tasa de rechazo por aseguradoras"
            theme={
              metrics.percent_ai_no_medic_yes_rejected < 20
                ? "warning"
                : "danger"
            }
          />
        </div>
      </div>
    </div>
  );
}
