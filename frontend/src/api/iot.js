import client from './client'

export const iotApi = {
  list:         ()        => client.get('/iot/'),
  create:       (data)    => client.post('/iot/', data),
  getDevice:    (device)  => client.get(`/iot/device/${device}`),
  remove:       (id)      => client.delete(`/iot/${id}`),
}
