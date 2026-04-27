import client from './client'

export const procurementApi = {
  list:         ()           => client.get('/procurement/'),
  create:       (data)       => client.post('/procurement/', data),
  update:       (id, data)   => client.put(`/procurement/${id}`, data),
  updateStatus: (id, status) => client.patch(`/procurement/${id}/status`, { status }),
  remove:       (id)         => client.delete(`/procurement/${id}`),
}
