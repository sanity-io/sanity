import type {CliCommandAction} from '@sanity/cli'
import {promptForDatasetName} from '../../../actions/dataset/datasetNamePrompt'
import {promptForDatasetAliasName} from '../../../actions/dataset/alias/promptForDatasetAliasName'
import {validateDatasetAliasName} from '../../../actions/dataset/alias/validateDatasetAliasName'
import {validateDatasetName} from '../../../actions/dataset/validateDatasetName'
import * as aliasClient from './datasetAliasesClient'
import {ALIAS_PREFIX} from './datasetAliasesClient'

export const createAliasHandler: CliCommandAction = async (args, context) => {
  const {apiClient, output, prompt} = context
  const [, alias, targetDataset] = args.argsWithoutOptions
  const client = apiClient()

  const nameError = alias && validateDatasetAliasName(alias)
  if (nameError) {
    throw new Error(nameError)
  }

  const [datasets, aliases, projectFeatures] = await Promise.all([
    client.datasets.list().then((sets) => sets.map((ds) => ds.name)),
    aliasClient.listAliases(client).then((sets) => sets.map((ds) => ds.name)),
    client.request({uri: '/features'}),
  ])

  let aliasName = await (alias || promptForDatasetAliasName(prompt))
  let aliasOutputName = aliasName

  if (aliasName.startsWith(ALIAS_PREFIX)) {
    aliasName = aliasName.substring(1)
  } else {
    aliasOutputName = `${ALIAS_PREFIX}${aliasName}`
  }

  if (aliases.includes(aliasName)) {
    throw new Error(`Dataset alias "${aliasOutputName}" already exists`)
  }

  if (targetDataset) {
    const datasetErr = validateDatasetName(targetDataset)
    if (datasetErr) {
      throw new Error(datasetErr)
    }
  }

  const datasetName = await (targetDataset || promptForDatasetName(prompt))
  if (datasetName && !datasets.includes(datasetName)) {
    throw new Error(`Dataset "${datasetName}" does not exist `)
  }

  const canCreateAlias = projectFeatures.includes('advancedDatasetManagement')
  if (!canCreateAlias) {
    throw new Error(`This project cannot create a dataset alias`)
  }

  try {
    await aliasClient.createAlias(client, aliasName, datasetName)
    output.print(
      `Dataset alias ${aliasOutputName} created ${
        datasetName && `and linked to ${datasetName}`
      } successfully`
    )
  } catch (err) {
    throw new Error(`Dataset alias creation failed:\n${err.message}`)
  }
}
