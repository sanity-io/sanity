import {CliCommandContext} from '@sanity/cli'
import {SanityClient} from '@sanity/client'
import {chooseDatasetPrompt} from '../dataset/chooseDatasetPrompt'

type ResolvedApiClient = {
  projectId: string
  datasetName: string
  token?: string
  client: SanityClient
}

async function resolveApiClient(
  context: CliCommandContext,
  datasetName: string,
  apiVersion: string,
): Promise<ResolvedApiClient> {
  const {apiClient} = context

  let client = apiClient()
  const {projectId, token} = client.config()

  if (!projectId) {
    throw new Error('Project ID not defined')
  }

  // Do not use dataset configured in Sanity config since dataset specified in command should override.
  let dataset = datasetName
  if (!dataset) {
    dataset = await chooseDatasetPrompt(context, {
      message: 'Select the dataset name:',
    })
  }

  client = client.clone().config({dataset: datasetName, apiVersion})

  return {
    projectId,
    datasetName: dataset,
    token,
    client,
  }
}

export default resolveApiClient
