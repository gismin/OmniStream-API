import client from './client'

export const execApi = {
  list:         ()           => client.get('/exec/'),
  create:       (data)       => client.post('/exec/', data),
  update:       (id, data)   => client.put(`/exec/${id}`, data),
  updateStatus: (id, status) => client.patch(`/exec/${id}/status`, { status }),
  remove:       (id)         => client.delete(`/exec/${id}`),
}
