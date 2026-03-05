import api from './api'

export const documentsService = {
  list: (params = {}) => api.get('/documents/', { params }),
  getByPage: (pageId) => api.get(`/documents/by-page/${pageId}`),
  get: (id) => api.get(`/documents/${id}`),
  // formData must be a FormData instance (title, description, page_id, file)
  upload: (formData) => api.post('/documents/', formData),
  update: (id, data) => api.patch(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
}
