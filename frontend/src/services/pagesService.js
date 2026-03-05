import api from './api'

export const pagesService = {
  list: () => api.get('/pages/'),
  get: (id) => api.get(`/pages/${id}`),
  create: (data) => api.post('/pages/', data),
  update: (id, data) => api.patch(`/pages/${id}`, data),
  delete: (id) => api.delete(`/pages/${id}`),
  reorder: (items) => api.post('/pages/reorder', { items }),
}
