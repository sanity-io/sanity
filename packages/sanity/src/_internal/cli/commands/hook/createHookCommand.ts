import type {CliCommandDefinition} from '@sanity/cli'
import open from 'open'

const createHookCommand: CliCommandDefinition = {
  name: 'create',
  group: 'hook',
  signature: '',
  helpText: '',
  description: 'Create a new hook for the given dataset',
  action: async (args, context) => {
    const {apiClient, output} = context
    const client = apiClient()

    const {projectId} = client.config()
    if (!projectId) {
      throw new Error('No project ID found')
    }

    const projectInfo = (await client.projects.getById(projectId)) || {}
    const organizationId = projectInfo.organizationId || 'personal'
    const manageUrl = `https://www.sanity.io/organizations/${organizationId}/project/${projectId}/api/webhooks/new`

    output.print(`Opening ${manageUrl}`)
    open(manageUrl)
  },
}

export default createHookCommand
