import {type CliApiClient} from '@sanity/cli'
import {type ClientConfig} from '@sanity/client'

export function createSchemaApiClient(
  apiClient: CliApiClient,
  apiOptions: Pick<ClientConfig, 'projectId' | 'apiHost' | 'dataset'>,
) {
  const client = apiClient({
    requireUser: true,
    requireProject: true,
    api: apiOptions,
  })

  const projectId = client.config().projectId
  const dataset = client.config().dataset
  if (!projectId) throw new Error('Project ID is not defined')
  if (!dataset) throw new Error('Dataset is not defined')

  return {
    client,
    projectId,
    dataset,
  }
}
