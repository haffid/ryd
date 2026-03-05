import api from './api'

export const usersService = {
  list: (params = {}) => api.get('/users/', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export const rolesService = {
  list: () => api.get('/roles/'),
  listPermissions: () => api.get('/roles/permissions'),
  create: (data) => api.post('/roles/', data),
  update: (id, data) => api.patch(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
}
