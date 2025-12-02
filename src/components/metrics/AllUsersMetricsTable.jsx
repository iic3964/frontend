import React, { useEffect, useState } from 'react';
import { getAllUsersMetrics, getTeamMetrics } from './mockMetricsData.js';

/**
 * AllUsersMetricsTable - Tabla completa de métricas de todos los usuarios
 *
 * Solo visible para supervisores y admins.
 * Muestra una tabla con las métricas de todos los médicos del equipo.
 */
export default function AllUsersMetricsTable() {
  const [allMetrics, setAllMetrics] = useState([]);
  const [teamMetrics, setTeamMetrics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });

  useEffect(() => {
    // Cargar todas las métricas
    const metrics = getAllUsersMetrics();
    setAllMetrics(metrics);

    // Cargar métricas del equipo
    const team = getTeamMetrics();
    setTeamMetrics(team);
  }, []);

  // Función de ordenamiento
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtrar y ordenar usuarios
  const filteredAndSortedMetrics = React.useMemo(() => {
    let filtered = [...allMetrics];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.nombre.toLowerCase().includes(query)
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Para ordenamiento numérico
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Para ordenamiento de strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return filtered;
  }, [allMetrics, searchQuery, sortConfig]);

  // Helper para renderizar el ícono de ordenamiento
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-white/30">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Helper para determinar el color del badge de rol
  const getRoleBadge = (rol) => {
    const badges = {
      'admin': { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Jefe Servicio' },
      'supervisor': { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Médico Jefe' },
      'resident': { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Residente' }
    };
    return badges[rol] || badges.resident;
  };

  return (
    <div className="space-y-6">
      {/* Header con métricas del equipo */}
      {teamMetrics && (
        <div className="bg-gradient-to-r from-health-accent/20 to-blue-500/20 border border-health-accent/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Resumen del Equipo Médico
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-white/60 mb-1">Total Usuarios</p>
              <p className="text-2xl font-bold text-white">{teamMetrics.totalUsuarios}</p>
            </div>
            <div>
              <p className="text-sm text-white/60 mb-1">Episodios Totales</p>
              <p className="text-2xl font-bold text-white">{teamMetrics.episodiosSubidos}</p>
            </div>
            <div>
              <p className="text-sm text-white/60 mb-1">% Rechazos Supervisor</p>
              <p className="text-2xl font-bold text-amber-400">{teamMetrics.pctRechazosSupervisor}%</p>
            </div>
            <div>
              <p className="text-sm text-white/60 mb-1">Casos Disputables</p>
              <p className="text-2xl font-bold text-health-accent">{teamMetrics.casosDisputables}</p>
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <input
          type="text"
          placeholder="Buscar médico por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/40 outline-none focus:border-health-accent transition"
        />
      </div>

      {/* Tabla de métricas */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/30">
              <tr className="text-left text-white/80">
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-white/5 transition whitespace-nowrap"
                  onClick={() => handleSort('nombre')}
                >
                  <div className="flex items-center gap-2">
                    <span>Nombre</span>
                    <span className="text-xs">{renderSortIcon('nombre')}</span>
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-white/5 transition whitespace-nowrap"
                  onClick={() => handleSort('rol')}
                >
                  <div className="flex items-center gap-2">
                    <span>Rol</span>
                    <span className="text-xs">{renderSortIcon('rol')}</span>
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-white/5 transition whitespace-nowrap text-center"
                  onClick={() => handleSort('episodiosSubidos')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span># Episodios</span>
                    <span className="text-xs">{renderSortIcon('episodiosSubidos')}</span>
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-white/5 transition whitespace-nowrap text-center"
                  onClick={() => handleSort('pctRechazosSupervisor')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>% Rechazo Supervisor</span>
                    <span className="text-xs">{renderSortIcon('pctRechazosSupervisor')}</span>
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-white/5 transition whitespace-nowrap text-center"
                  onClick={() => handleSort('pctRechazosAseguradora')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>% Rechazo Aseguradora</span>
                    <span className="text-xs">{renderSortIcon('pctRechazosAseguradora')}</span>
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-white/5 transition whitespace-nowrap text-center"
                  onClick={() => handleSort('casosDisputables')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Casos Disputables</span>
                    <span className="text-xs">{renderSortIcon('casosDisputables')}</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filteredAndSortedMetrics.length > 0 ? (
                filteredAndSortedMetrics.map((user) => {
                  const roleBadge = getRoleBadge(user.rol);

                  return (
                    <tr key={user.userId} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-white">
                        {user.nombre}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${roleBadge.bg} ${roleBadge.text}`}>
                          {roleBadge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap text-white">
                        {user.episodiosSubidos}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className={`font-semibold ${
                            user.pctRechazosSupervisor < 10 ? 'text-green-400' :
                            user.pctRechazosSupervisor < 20 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {user.pctRechazosSupervisor}%
                          </span>
                          <span className="text-xs text-white/40">
                            ({user.rechazosSupervisor})
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className={`font-semibold ${
                            user.pctRechazosAseguradora < 15 ? 'text-green-400' :
                            user.pctRechazosAseguradora < 25 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {user.pctRechazosAseguradora}%
                          </span>
                          <span className="text-xs text-white/40">
                            ({user.totalRechazosAseguradora})
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-lg font-bold ${
                          user.casosDisputables > 6 ? 'bg-health-accent/20 text-health-accent' :
                          user.casosDisputables > 3 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-white/10 text-white/70'
                        }`}>
                          {user.casosDisputables}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                    {searchQuery ? 'No se encontraron resultados para tu búsqueda' : 'No hay datos disponibles'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda informativa */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="text-xl">💡</div>
          <div className="flex-1">
            <p className="text-sm text-blue-300 font-medium mb-2">
              Sobre de los indicadores
            </p>
            <ul className="text-xs text-white/60 space-y-1">
              <li><strong>% Rechazo Supervisor:</strong> Porcentaje de episodios rechazados en la primera revisión médica</li>
              <li><strong>% Rechazo Aseguradora:</strong> Porcentaje de episodios rechazados por la aseguradora</li>
              <li><strong>Casos Disputables:</strong> Episodios rechazados por aseguradora pero aprobados por el supervisor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
