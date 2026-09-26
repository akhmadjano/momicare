import axios from 'axios'

const BASE_URL = 'http://localhost:8080/api'

const api = axios.create({ baseURL: BASE_URL })

// Attach auth token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('momicare_auth')
    if (raw) {
      const { token } = JSON.parse(raw)
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

// Redirect to /not-authorized on 403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 403) {
      window.location.href = '/not-authorized'
    }
    return Promise.reject(err)
  }
)

export default api
