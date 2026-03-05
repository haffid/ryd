import api from './api'

export const insightsService = {
  list: (params = {}) => api.get('/insights/', { params }),
  get: (id) => api.get(`/insights/${id}`),
  create: (data) => api.post('/insights/', data),
  update: (id, data) => api.patch(`/insights/${id}`, data),
  delete: (id) => api.delete(`/insights/${id}`),
}

export const categoriesService = {
  list: () => api.get('/categories/'),
  update: (id, data) => api.patch(`/categories/${id}`, data),
}
