import apiClient from '../../apiClient'

export default opts =>
  apiClient().then(client => client.createDataset(opts))
