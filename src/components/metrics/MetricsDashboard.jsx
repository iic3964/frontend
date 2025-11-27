import React, { useState, useEffect } from 'react';
import MetricCard, { MetricCardWithProgress } from './MetricCard.jsx';
import { getUserMetrics } from './mockMetricsData.js';

/**
 * MetricsDashboard - Dashboard de métricas individuales
 * 
 * Muestra las métricas personales de un médico:
 * - Total de episodios subidos
 * - % de rechazos por supervisor
 * - % de rechazos por aseguradora
 * - Casos disputables (rechazados por aseguradora pero aprobados por médico)
 */
export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [userName, setUserName] = useState('Usuario');
  const [userRole, setUserRole] = useState('resident');

  useEffect(() => {
    // Obtener datos del usuario del localStorage
    try {
      const sessionStr = localStorage.getItem('saluia.session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const userId = session.user?.id;
        const role = session.user?.user_metadata?.role || 'resident';
        const firstName = session.user?.user_metadata?.first_name || '';
        const lastName = session.user?.user_metadata?.last_name || '';
        
        setUserName(`${firstName} ${lastName}`.trim() || 'Usuario');
        setUserRole(role);
        
        // Cargar métricas del usuario
        const userMetrics = getUserMetrics(userId);
        setMetrics(userMetrics);
      }
    } catch (error) {
      console.error('Error loading user metrics:', error);
    }
  }, []);

  if (!metrics) {
    return (
      <div className="text-white/70 text-center py-8">
        Cargando métricas...
      </div>
    );
  }

  // Calcular el total de rechazos de aseguradora
  const totalRechazosAseguradora = metrics.totalRechazosAseguradora || 0;
  
  // Determinar el rol en español
  const roleLabels = {
    'resident': 'Médico Residente',
    'supervisor': 'Médico Jefe de Turno',
    'admin': 'Jefe de Servicio'
  };

  return (
    <div className="space-y-6">
      {/* Header con info del usuario */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Tus Métricas Personales
            </h2>
            <p className="text-white/60 text-sm">
              {userName} • {roleLabels[userRole] || 'Médico'}
            </p>
          </div>
          
          {/* Selector de rango de fechas (UI only) */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Período:</span>
            <select 
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-health-accent"
              defaultValue="all"
            >
              <option value="all">Todos los tiempos</option>
              <option value="month">Último mes</option>
              <option value="quarter">Último trimestre</option>
              <option value="year">Último año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de episodios */}
        <MetricCard
          title="Episodios Subidos"
          value={metrics.episodiosSubidos}
          subtitle="Total de episodios registrados"
          theme="info"
          icon="📋"
        />

        {/* % Rechazos por supervisor */}
        <MetricCardWithProgress
          title="Rechazos por Supervisor"
          value={metrics.pctRechazosSupervisor}
          count={metrics.rechazosSupervisor}
          total={metrics.episodiosSubidos}
          subtitle={`${metrics.rechazosSupervisor} de ${metrics.episodiosSubidos} episodios`}
          theme={metrics.pctRechazosSupervisor < 10 ? 'success' : metrics.pctRechazosSupervisor < 20 ? 'warning' : 'danger'}
        />

        {/* % Rechazos por aseguradora */}
        <MetricCardWithProgress
          title="Rechazos por Aseguradora"
          value={metrics.pctRechazosAseguradora}
          count={totalRechazosAseguradora}
          total={metrics.episodiosSubidos}
          subtitle={`${totalRechazosAseguradora} episodios rechazados`}
          theme={metrics.pctRechazosAseguradora < 15 ? 'success' : metrics.pctRechazosAseguradora < 25 ? 'warning' : 'danger'}
        />
      </div>

      {/* Desglose detallado de rechazos de aseguradora */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Desglose de Rechazos de Aseguradora
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aprobados por supervisor pero rechazados por aseguradora */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">
                  Aprobados por Supervisor
                </p>
                <p className="text-2xl font-bold text-red-400">
                  {metrics.rechazosAseguradora.aprobadosPorSupervisor}
                </p>
                <p className="text-xs text-white/50 mt-2">
                  Estos casos pueden ser disputables con la aseguradora
                </p>
              </div>
              <div className="text-2xl">🔍</div>
            </div>
          </div>

          {/* Rechazados por supervisor Y por aseguradora */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">
                  Rechazados por Supervisor
                </p>
                <p className="text-2xl font-bold text-white/70">
                  {metrics.rechazosAseguradora.rechazadosPorSupervisor}
                </p>
                <p className="text-xs text-white/50 mt-2">
                  Rechazados en ambas instancias de revisión
                </p>
              </div>
              <div className="text-2xl">✕</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

