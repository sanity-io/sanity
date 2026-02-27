import {type CliApiClient} from '@sanity/cli'

export function createSchemaApiClient(apiClient: CliApiClient) {
  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).withConfig({apiVersion: 'v2025-03-01', useCdn: false})

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
