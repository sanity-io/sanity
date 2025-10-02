import {type CliApiClient} from '@sanity/cli'
import {type ClientConfig} from '@sanity/client'

import {getToken} from '../../../util/getToken'

export function createSchemaApiClient(
  apiClient: CliApiClient,
  clientOptions: Pick<ClientConfig, 'projectId' | 'apiHost' | 'dataset'>,
) {
  const client = apiClient({
    requireUser: false,
    requireProject: true,
  }).withConfig({...clientOptions, token: getToken(clientOptions.apiHost)})

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
