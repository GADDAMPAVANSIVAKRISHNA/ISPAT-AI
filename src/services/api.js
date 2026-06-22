const BASE_URL = 'http://localhost:8000/api/v1';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || response.statusText || 'API request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email, name, role) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, name, role }),
      }),
    getUsers: () => request('/auth/users'),
  },

  dashboard: {
    getSummary: () => request('/dashboard'),
  },

  machines: {
    getAll: (status) => {
      const url = status && status !== 'all' ? `/machines?status=${status}` : '/machines';
      return request(url);
    },
    getDetail: (id) => request(`/machines/${id}`),
    getSummary: () => request('/machines/summary'),
    getRulOverview: () => request('/machines/rul'),
  },

  production: {
    getDaily: (limit) => {
      const url = limit ? `/production/daily?limit=${limit}` : '/production/daily';
      return request(url);
    },
    getToday: () => request('/production/today'),
    getMonthly: () => request('/production/monthly'),
    getRCA: () => request('/production/rca'),
  },

  shifts: {
    getAll: (date) => {
      const url = date ? `/shifts?date=${date}` : '/shifts';
      return request(url);
    },
    getIncidents: (date) => {
      const url = date ? `/shifts/incidents?date=${date}` : '/shifts/incidents';
      return request(url);
    },
    getWeekly: () => request('/shifts/weekly'),
  },

  energy: {
    getDaily: () => request('/energy/daily'),
    getWaste: () => request('/energy/waste'),
    getSummary: () => request('/energy/summary'),
    getDepartments: () => request('/energy/departments'),
  },

  departments: {
    getAll: () => request('/departments'),
    getWeekly: () => request('/departments/weekly'),
  },

  knowledge: {
    getAll: (search, department, severity) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (department && department !== 'All Departments') params.append('department', department);
      if (severity && severity !== 'All') params.append('severity', severity);
      const queryStr = params.toString();
      const url = queryStr ? `/knowledge?${queryStr}` : '/knowledge';
      return request(url);
    },
    create: (entry) =>
      request('/knowledge', {
        method: 'POST',
        body: JSON.stringify(entry),
      }),
    getStats: () => request('/knowledge/stats'),
  },

  alerts: {
    getAll: (severity, acknowledged) => {
      const params = new URLSearchParams();
      if (severity && severity !== 'All') params.append('severity', severity);
      if (acknowledged !== undefined) params.append('acknowledged', acknowledged);
      const queryStr = params.toString();
      const url = queryStr ? `/alerts?${queryStr}` : '/alerts';
      return request(url);
    },
    acknowledge: (id) =>
      request(`/alerts/${id}/acknowledge`, {
        method: 'PATCH',
      }),
    getSummary: () => request('/alerts/summary'),
  },
};
