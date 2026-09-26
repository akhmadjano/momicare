import api from './client'

export const register       = (data) => api.post('/auth/register', data)
export const loginByPhone   = (data) => api.post('/auth/login-by-phone', data)
export const loginStaff     = (data) => api.post('/auth/login', data)
