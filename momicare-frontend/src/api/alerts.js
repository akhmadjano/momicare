import api from './client'

export const getAlerts    = ()           => api.get('/alerts')
export const updateAlert  = (id, status) => api.patch(`/alerts/${id}`, { status })
