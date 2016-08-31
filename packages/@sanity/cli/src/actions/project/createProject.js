export default function createProject(apiClient, options) {
  return apiClient({
    requireUser: true,
    requireProject: false
  }).request({
    method: 'POST',
    uri: '/projects',
    json: options
  }).then(response => ({
    projectId: response.projectId,
    displayName: options.displayName || ''
  }))
}
