import client from './client'

export const authApi = {
  login: (username, password) => client.post('/auth/login', { username, password }),
  me:    (token) => client.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  }),
}
