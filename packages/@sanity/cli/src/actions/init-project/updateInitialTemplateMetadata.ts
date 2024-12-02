import {debug} from '../../debug'
import {type CliApiClient} from '../../types'

export async function updateInitialTemplateMetadata(
  apiClient: CliApiClient,
  projectId: string,
  templateName: string,
): Promise<void> {
  try {
    await apiClient({api: {projectId}}).request({
      method: 'PATCH',
      uri: `/projects/${projectId}`,
      body: {metadata: {initialTemplate: templateName}},
    })
  } catch (err: unknown) {
    // Non-critical that we update this metadata, and user does not need to be aware
    let message = typeof err === 'string' ? err : '<unknown error>'
    if (err instanceof Error) {
      message = err.message
    }

    debug('Failed to update initial template metadata for project: %s', message)
  }
}
