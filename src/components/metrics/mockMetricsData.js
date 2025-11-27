/**
 * Mock Metrics Data for Demo
 * 
 * Este archivo contiene datos de prueba para validar la UI de métricas
 * con el cliente antes de conectar con el backend real.
 * 
 * Fase 2: Estos datos serán reemplazados por llamadas al backend.
 * La estructura está diseñada para ser compatible con Chart.js cuando se instale.
 */

// Datos dummy de métricas por usuario
export const userMetrics = {
  // Supervisores experimentados (bajo % de rechazos)
  'supervisor-1': {
    userId: 'supervisor-1',
    nombre: 'Dr. Carlos Méndez',
    rol: 'supervisor',
    episodiosSubidos: 52,
    rechazosSupervisor: 4,  // ~7.7%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 6,  // Casos disputables
      rechazadosPorSupervisor: 1
    }
  },
  'supervisor-2': {
    userId: 'supervisor-2',
    nombre: 'Dra. Patricia Rojas',
    rol: 'supervisor',
    episodiosSubidos: 48,
    rechazosSupervisor: 3,  // ~6.3%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 4,
      rechazadosPorSupervisor: 1
    }
  },
  'supervisor-3': {
    userId: 'supervisor-3',
    nombre: 'Dr. Roberto Silva',
    rol: 'supervisor',
    episodiosSubidos: 45,
    rechazosSupervisor: 5,  // ~11.1%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 3,
      rechazadosPorSupervisor: 2
    }
  },

  // Médicos residentes experimentados (desempeño medio-bueno)
  'resident-1': {
    userId: 'resident-1',
    nombre: 'Dr. Juan Pérez',
    rol: 'resident',
    episodiosSubidos: 64,
    rechazosSupervisor: 8,  // ~12.5%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 7,  // Casos disputables importantes
      rechazadosPorSupervisor: 3
    }
  },
  'resident-2': {
    userId: 'resident-2',
    nombre: 'Dra. María González',
    rol: 'resident',
    episodiosSubidos: 58,
    rechazosSupervisor: 6,  // ~10.3%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 5,
      rechazadosPorSupervisor: 2
    }
  },
  'resident-3': {
    userId: 'resident-3',
    nombre: 'Dr. Andrés Morales',
    rol: 'resident',
    episodiosSubidos: 67,
    rechazosSupervisor: 9,  // ~13.4%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 8,  // Muchos casos disputables
      rechazadosPorSupervisor: 4
    }
  },
  'resident-4': {
    userId: 'resident-4',
    nombre: 'Dra. Sofía Ramírez',
    rol: 'resident',
    episodiosSubidos: 55,
    rechazosSupervisor: 7,  // ~12.7%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 4,
      rechazadosPorSupervisor: 2
    }
  },
  'resident-5': {
    userId: 'resident-5',
    nombre: 'Dr. Diego Torres',
    rol: 'resident',
    episodiosSubidos: 61,
    rechazosSupervisor: 10,  // ~16.4%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 6,
      rechazadosPorSupervisor: 3
    }
  },

  // Médicos residentes nuevos (más rechazos)
  'f53cd082-e951-4e9d-aa69-3ed5c96cd7c7': {
    userId: 'f53cd082-e951-4e9d-aa69-3ed5c96cd7c7',
    nombre: 'Dr. Julio Vargas',
    rol: 'resident',
    episodiosSubidos: 28,
    rechazosSupervisor: 11,  // ~39.3% (nueva)
    rechazosAseguradora: {
      aprobadosPorSupervisor: 2,
      rechazadosPorSupervisor: 5
    }
  },
  'resident-7': {
    userId: 'resident-7',
    nombre: 'Dr. Felipe Soto',
    rol: 'resident',
    episodiosSubidos: 32,
    rechazosSupervisor: 9,  // ~28.1%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 3,
      rechazadosPorSupervisor: 4
    }
  },
  'resident-8': {
    userId: 'resident-8',
    nombre: 'Dra. Valentina Castro',
    rol: 'resident',
    episodiosSubidos: 24,
    rechazosSupervisor: 8,  // ~33.3%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 2,
      rechazadosPorSupervisor: 3
    }
  },

  // Médicos con desempeño mixto
  'resident-9': {
    userId: 'resident-9',
    nombre: 'Dr. Matías Fuentes',
    rol: 'resident',
    episodiosSubidos: 43,
    rechazosSupervisor: 9,  // ~20.9%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 5,
      rechazadosPorSupervisor: 3
    }
  },
  'resident-10': {
    userId: 'resident-10',
    nombre: 'Dra. Javiera Pinto',
    rol: 'resident',
    episodiosSubidos: 50,
    rechazosSupervisor: 11,  // ~22%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 6,
      rechazadosPorSupervisor: 4
    }
  },
  'resident-11': {
    userId: 'resident-11',
    nombre: 'Dr. Sebastián Herrera',
    rol: 'resident',
    episodiosSubidos: 39,
    rechazosSupervisor: 6,  // ~15.4%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 4,
      rechazadosPorSupervisor: 2
    }
  },
  'resident-12': {
    userId: 'resident-12',
    nombre: 'Dra. Fernanda Lagos',
    rol: 'resident',
    episodiosSubidos: 46,
    rechazosSupervisor: 8,  // ~17.4%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 5,
      rechazadosPorSupervisor: 3
    }
  },

  // Médicos con muy buen desempeño
  'resident-13': {
    userId: 'resident-13',
    nombre: 'Dr. Nicolás Bravo',
    rol: 'resident',
    episodiosSubidos: 71,
    rechazosSupervisor: 4,  // ~5.6% (excelente)
    rechazosAseguradora: {
      aprobadosPorSupervisor: 9,  // Muchos casos disputables
      rechazadosPorSupervisor: 1
    }
  },
  'resident-14': {
    userId: 'resident-14',
    nombre: 'Dra. Isidora Muñoz',
    rol: 'resident',
    episodiosSubidos: 68,
    rechazosSupervisor: 5,  // ~7.4%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 8,
      rechazadosPorSupervisor: 2
    }
  },

  // Casos específicos interesantes
  'resident-15': {
    userId: 'resident-15',
    nombre: 'Dr. Lucas Sepúlveda',
    rol: 'resident',
    episodiosSubidos: 35,
    rechazosSupervisor: 7,  // ~20%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 10,  // MUCHOS casos disputables (esto es importante)
      rechazadosPorSupervisor: 2
    }
  },
  'resident-16': {
    userId: 'resident-16',
    nombre: 'Dra. Antonia Vega',
    rol: 'resident',
    episodiosSubidos: 42,
    rechazosSupervisor: 6,  // ~14.3%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 7,
      rechazadosPorSupervisor: 2
    }
  },
  'd34ca318-a30d-4112-aa04-7d4fd426d728': {
    userId: 'd34ca318-a30d-4112-aa04-7d4fd426d728',
    nombre: 'Dr. Tomás Reyes',
    rol: 'resident',
    episodiosSubidos: 53,
    rechazosSupervisor: 10,  // ~18.9%
    rechazosAseguradora: {
      aprobadosPorSupervisor: 6,
      rechazadosPorSupervisor: 4
    }
  },

  // Admin
  'admin-1': {
    userId: 'admin-1',
    nombre: 'Dr. Ricardo Valenzuela',
    rol: 'admin',
    episodiosSubidos: 38,
    rechazosSupervisor: 2,  // ~5.3% (jefe de servicio)
    rechazosAseguradora: {
      aprobadosPorSupervisor: 5,
      rechazadosPorSupervisor: 1
    }
  }
};

/**
 * Calcula un porcentaje de forma consistente
 * @param {number} parte - Valor parcial
 * @param {number} total - Valor total
 * @returns {number} - Porcentaje redondeado a 1 decimal
 */
export function calculatePercentage(parte, total) {
  if (total === 0) return 0;
  return Math.round((parte / total) * 1000) / 10;
}

/**
 * Obtiene las métricas de un usuario específico
 * @param {string} userId - ID del usuario
 * @returns {object|null} - Objeto con métricas del usuario o null si no existe
 */
export function getUserMetrics(userId) {
  const metrics = userMetrics[userId];
  
  if (!metrics) {
    // Retornar datos vacíos si el usuario no existe
    return {
      userId: userId,
      nombre: 'Usuario Desconocido',
      rol: 'resident',
      episodiosSubidos: 0,
      rechazosSupervisor: 0,
      rechazosAseguradora: {
        aprobadosPorSupervisor: 0,
        rechazadosPorSupervisor: 0
      }
    };
  }
  
  // Calcular métricas derivadas
  const totalRechazosAseguradora = 
    metrics.rechazosAseguradora.aprobadosPorSupervisor + 
    metrics.rechazosAseguradora.rechazadosPorSupervisor;
  
  return {
    ...metrics,
    // Métricas calculadas
    pctRechazosSupervisor: calculatePercentage(
      metrics.rechazosSupervisor, 
      metrics.episodiosSubidos
    ),
    pctRechazosAseguradora: calculatePercentage(
      totalRechazosAseguradora, 
      metrics.episodiosSubidos
    ),
    totalRechazosAseguradora: totalRechazosAseguradora,
    casosDisputables: metrics.rechazosAseguradora.aprobadosPorSupervisor
  };
}

/**
 * Obtiene las métricas de todos los usuarios
 * @returns {array} - Array de objetos con métricas de todos los usuarios
 */
export function getAllUsersMetrics() {
  return Object.keys(userMetrics).map(userId => getUserMetrics(userId));
}

/**
 * Obtiene datos agregados del equipo completo
 * @returns {object} - Métricas agregadas de todo el equipo
 */
export function getTeamMetrics() {
  const allMetrics = getAllUsersMetrics();
  
  const totals = allMetrics.reduce((acc, user) => {
    return {
      episodiosSubidos: acc.episodiosSubidos + user.episodiosSubidos,
      rechazosSupervisor: acc.rechazosSupervisor + user.rechazosSupervisor,
      totalRechazosAseguradora: acc.totalRechazosAseguradora + user.totalRechazosAseguradora,
      casosDisputables: acc.casosDisputables + user.casosDisputables
    };
  }, {
    episodiosSubidos: 0,
    rechazosSupervisor: 0,
    totalRechazosAseguradora: 0,
    casosDisputables: 0
  });
  
  return {
    ...totals,
    pctRechazosSupervisor: calculatePercentage(totals.rechazosSupervisor, totals.episodiosSubidos),
    pctRechazosAseguradora: calculatePercentage(totals.totalRechazosAseguradora, totals.episodiosSubidos),
    totalUsuarios: allMetrics.length
  };
}

/**
 * Prepara datos en formato Chart.js para futura implementación
 * @param {string} userId - ID del usuario (opcional, si no se pasa retorna datos del equipo)
 * @returns {object} - Datos formateados para Chart.js
 */
export function getChartData(userId = null) {
  const metrics = userId ? getUserMetrics(userId) : getTeamMetrics();
  
  return {
    labels: ['Aprobados', 'Rechazados Supervisor', 'Rechazados Aseguradora'],
    datasets: [{
      label: 'Episodios',
      data: [
        metrics.episodiosSubidos - metrics.rechazosSupervisor - (metrics.totalRechazosAseguradora || 0),
        metrics.rechazosSupervisor,
        metrics.totalRechazosAseguradora || 0
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.2)',   // green for approved
        'rgba(251, 191, 36, 0.2)',  // amber for supervisor rejections
        'rgba(239, 68, 68, 0.2)'    // red for insurance rejections
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 1
    }]
  };
}

