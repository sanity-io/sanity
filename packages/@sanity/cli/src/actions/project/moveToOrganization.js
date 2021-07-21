export default function moveToOrganization(apiClient, projectId, organizationId) {
  return apiClient({
    requireUser: true,
    requireProject: false,
  })
    .request({
      method: 'PUT',
      uri: `/projects/${projectId}/organization`,
      body: {organizationId},
    })
    .then((response) => ({
      organizationId: response.organizationId,
    }))
}
