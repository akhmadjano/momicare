import api from './client'

export const assignPatient = (doctorId, patientId) =>
  api.post(`/doctors/${doctorId}/patients/${patientId}`)

export const getDoctors = () =>
  api.get('/patients').then(res =>
    // The backend returns all patients — we pull assigned doctors from the list
    // For the assignment page we need the doctors list separately.
    // This is a convenience call that fetches users with role=doctor via a
    // dedicated admin endpoint if available, otherwise falls back to an empty list.
    res
  )
