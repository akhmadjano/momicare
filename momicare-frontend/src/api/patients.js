import api from './client'

export const getPatients      = ()         => api.get('/patients')
export const getPatient       = (id)       => api.get(`/patients/${id}`)
export const createPatient    = (data)     => api.post('/patients', data)

export const submitReading    = (id, data) => api.post(`/patients/${id}/readings`, data)
export const parseVoiceText   = (id, text) => api.post(`/patients/${id}/readings/parse-voice`, { text })
export const parseVoiceAudio  = (id, blob) => {
  const form = new FormData()
  form.append('audio', blob, 'recording.webm')
  return api.post(`/patients/${id}/readings/voice`, form)
}

export const getRisk          = (id)       => api.get(`/patients/${id}/risk`)
export const getRiskHistory   = (id)       => api.get(`/patients/${id}/risk/history`)
export const getAiChecks      = (id)       => api.get(`/patients/${id}/risk/ai-checks`)
export const getInstructions  = (id)       => api.get(`/patients/${id}/instructions`)

export const getActivity      = (id, limit = 20, offset = 0) =>
  api.get(`/patients/${id}/activity`, { params: { limit, offset } })
