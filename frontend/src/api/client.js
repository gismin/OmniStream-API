import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage to every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Extract FastAPI detail messages from error responses
client.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.detail ?? err.message ?? 'Unknown error'
    return Promise.reject(new Error(Array.isArray(message) ? message[0]?.msg : message))
  }
)

export default client
