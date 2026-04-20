import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Global error interceptor — extracts FastAPI detail messages
client.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.detail ?? err.message ?? 'Unknown error'
    return Promise.reject(new Error(Array.isArray(message) ? message[0]?.msg : message))
  }
)

export default client
