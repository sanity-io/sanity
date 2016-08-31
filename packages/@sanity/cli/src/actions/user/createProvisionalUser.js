export default function createProvisionalUser(apiClient) {
  return apiClient({
    requireUser: false,
    requireProject: false
  }).request({
    method: 'POST',
    uri: '/users/provisional'
  })
}
