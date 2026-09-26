import api from './client'

export const getRegionalSummary = () => api.get('/regions/summary')
