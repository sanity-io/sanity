import {type CliCommandContext} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'

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

  // If no dataset provided, explicitly ask for dataset instead of using dataset
  // configured in Sanity config. Aligns with `sanity dataset export` behavior.
  let selectedDataset: string = datasetName
  if (!selectedDataset) {
    selectedDataset = await chooseDatasetPrompt(context, {
      message: 'Select the dataset name:',
    })
  }

  client = client.withConfig({dataset: datasetName, apiVersion})

  return {
    projectId,
    datasetName: selectedDataset,
    token,
    client,
  }
}

export default resolveApiClient
