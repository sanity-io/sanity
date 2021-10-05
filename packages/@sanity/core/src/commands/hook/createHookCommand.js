import open from 'opn'

export default {
  name: 'create',
  group: 'hook',
  signature: '',
  description: 'Create a new hook for the given dataset',
  action: async (args, context) => {
    const {apiClient, output} = context
    const client = apiClient()

    const {projectId} = client.config()
    const projectInfo = (await client.projects.getById(projectId)) || {}
    const organizationId = projectInfo.organizationId || 'personal'
    const manageUrl = `https://www.sanity.io/organizations/${organizationId}/project/${projectId}/api/webhooks/new`

    output.print(`Opening ${manageUrl}`)
    open(manageUrl, {wait: false})
  },
}
