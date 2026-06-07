import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export const studentsAPI = {
  list: (params) => api.get('/students', { params }).then(r => r.data),
  get: (id) => api.get(`/students/${id}`).then(r => r.data),
  create: (data) => api.post('/students', data).then(r => r.data),
  update: (id, data) => api.put(`/students/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/students/${id}`).then(r => r.data),
  getArtworks: (id, semester) => api.get(`/students/${id}/artworks`, { params: { semester } }).then(r => r.data),
}

export const artworksAPI = {
  list: (params) => api.get('/artworks', { params }).then(r => r.data),
  get: (id) => api.get(`/artworks/${id}`).then(r => r.data),
  create: (data) => api.post('/artworks', data).then(r => r.data),
  update: (id, data) => api.put(`/artworks/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/artworks/${id}`).then(r => r.data),
  updateTags: (id, tag_ids) => api.post(`/artworks/${id}/tags`, { tag_ids }).then(r => r.data),
  like: (id, access_code_id) => api.post(`/artworks/${id}/like`, { access_code_id }).then(r => r.data),
  getLikes: (id) => api.get(`/artworks/${id}/likes`).then(r => r.data),
  getMyLikes: (access_code_id) => api.get('/artworks/likes/mine', { params: { access_code_id } }).then(r => r.data),
}

export const tagsAPI = {
  list: (params) => api.get('/tags', { params }).then(r => r.data),
  categories: () => api.get('/tags/categories').then(r => r.data),
  create: (data) => api.post('/tags', data).then(r => r.data),
  update: (id, data) => api.put(`/tags/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/tags/${id}`).then(r => r.data),
}

export const accessAPI = {
  verify: (code) => api.post('/access/verify', { code }).then(r => r.data),
  getByStudent: (studentId) => api.get(`/access/student/${studentId}`).then(r => r.data),
  create: (studentId, data) => api.post(`/access/student/${studentId}`, data).then(r => r.data),
  delete: (id) => api.delete(`/access/${id}`).then(r => r.data),
}

export const messagesAPI = {
  list: (params) => api.get('/messages', { params }).then(r => r.data),
  byStudent: () => api.get('/messages/by-student').then(r => r.data),
  create: (data) => api.post('/messages', data).then(r => r.data),
  reply: (id, reply) => api.post(`/messages/${id}/reply`, { reply }).then(r => r.data),
}

export const semestersAPI = {
  list: () => api.get('/semesters').then(r => r.data),
  current: () => api.get('/semesters/current').then(r => r.data),
  create: (data) => api.post('/semesters', data).then(r => r.data),
  setCurrent: (id) => api.put(`/semesters/${id}/set-current`).then(r => r.data),
  delete: (id) => api.delete(`/semesters/${id}`).then(r => r.data),
}

export const uploadAPI = {
  uploadSingle: (file, semester, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('semester', semester)
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    }).then(r => r.data)
  },
  uploadBatch: (files, semester) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('semester', semester)
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}

export const exportAPI = {
  portfolioHTML: (studentId, semester) => {
    window.open(`/api/export/student/${studentId}/semester/${semester}`, '_blank')
  },
  portfolioZip: (studentId, semester) => {
    window.open(`/api/export/student/${studentId}/semester/${semester}/zip`, '_blank')
  },
}

export default api
