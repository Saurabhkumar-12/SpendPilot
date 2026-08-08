const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('spendpilot_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  if (options.isFormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('spendpilot_token');
        localStorage.removeItem('spendpilot_user');
        window.location.href = '/login';
      }
      throw new Error(data.error || 'Request failed.');
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail: (token, email) => request(`/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  logoutAll: () => request('/auth/logout-all', { method: 'POST' }),
  deleteAccount: () => request('/auth/account', { method: 'DELETE' }),

  // Personal Expenses
  getPersonalExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/expenses/personal?${query}`);
  },
  addPersonalExpense: (data) => request('/expenses/personal', { method: 'POST', body: JSON.stringify(data) }),
  editPersonalExpense: (id, data) => request(`/expenses/personal/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePersonalExpense: (id) => request(`/expenses/personal/${id}`, { method: 'DELETE' }),
  getCategories: () => request('/expenses/categories'),
  createCustomCategory: (data) => request('/expenses/categories/custom', { method: 'POST', body: JSON.stringify(data) }),

  // Groups
  getGroups: () => request('/groups'),
  createGroup: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  getGroupDetails: (id) => request(`/groups/${id}`),
  editGroup: (id, data) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroup: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
  inviteMember: (groupId, payload) => {
    const bodyData = typeof payload === 'string' ? { name: payload, email: payload } : payload;
    return request(`/groups/${groupId}/invite`, { method: 'POST', body: JSON.stringify(bodyData) });
  },
  removeMember: (groupId, memberId) => request(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' }),
  addGroupExpense: (groupId, data) => request(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  editGroupExpense: (expenseId, data) => request(`/groups/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroupExpense: (expenseId) => request(`/groups/expenses/${expenseId}`, { method: 'DELETE' }),

  // Settlements
  getPendingSettlements: () => request('/settlements/pending'),
  markAsSettled: (data) => request('/settlements/settle', { method: 'POST', body: JSON.stringify(data) }),
  getSettlementHistory: () => request('/settlements/history'),

  // Reports & Dashboard
  getDashboardSummary: () => request('/reports/dashboard'),
  getReports: (timeframe = 'monthly') => request(`/reports/analytics?timeframe=${timeframe}`),

  // Search & Insights
  globalSearch: (q) => request(`/search?q=${encodeURIComponent(q)}`),
  getAIInsights: () => request('/insights/ai'),
  convertCurrency: (amount, from, to) => request(`/insights/convert?amount=${amount}&from=${from}&to=${to}`),

  // Profile & Preferences
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  uploadAvatar: (formData) => request('/profile/avatar', { method: 'POST', body: formData, isFormData: true }),
  updatePreferences: (data) => request('/profile/preferences', { method: 'PUT', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  // Community Feedback
  getFeedback: () => request('/feedback'),
  submitFeedback: (data) => request('/feedback', { method: 'POST', body: JSON.stringify(data) })
};
