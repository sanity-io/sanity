import type {CliCommandAction} from '@sanity/cli'
import {promptForDatasetName} from '../../../actions/dataset/datasetNamePrompt'
import {promptForDatasetAliasName} from '../../../actions/dataset/alias/promptForDatasetAliasName'
import {validateDatasetAliasName} from '../../../actions/dataset/alias/validateDatasetAliasName'
import {validateDatasetName} from '../../../actions/dataset/validateDatasetName'
import * as aliasClient from './datasetAliasesClient'
import {ALIAS_PREFIX} from './datasetAliasesClient'

export const linkAliasHandler: CliCommandAction = async (args, context) => {
  const {apiClient, output, prompt} = context
  const [, alias, targetDataset] = args.argsWithoutOptions
  const flags = args.extOptions
  const client = apiClient()

  const nameError = alias && validateDatasetAliasName(alias)
  if (nameError) {
    throw new Error(nameError)
  }

  const [datasets, fetchedAliases] = await Promise.all([
    client.datasets.list().then((sets) => sets.map((ds) => ds.name)),
    aliasClient.listAliases(client),
  ])
  const aliases = fetchedAliases.map((da) => da.name)

  let aliasName = await (alias || promptForDatasetAliasName(prompt))
  let aliasOutputName = aliasName

  if (aliasName.startsWith(ALIAS_PREFIX)) {
    aliasName = aliasName.substring(1)
  } else {
    aliasOutputName = `${ALIAS_PREFIX}${aliasName}`
  }

  if (!aliases.includes(aliasName)) {
    throw new Error(`Dataset alias "${aliasOutputName}" does not exist `)
  }

  const datasetName = await (targetDataset || promptForDatasetName(prompt))
  const datasetErr = validateDatasetName(datasetName)
  if (datasetErr) {
    throw new Error(datasetErr)
  }

  if (!datasets.includes(datasetName)) {
    throw new Error(`Dataset "${datasetName}" does not exist `)
  }

  const linkedAlias = fetchedAliases.find((elem) => elem.name === aliasName)

  if (linkedAlias && linkedAlias.datasetName) {
    if (linkedAlias.datasetName === datasetName) {
      throw new Error(`Dataset alias ${aliasOutputName} already linked to ${datasetName}`)
    }

    if (!flags.force) {
      await prompt.single({
        type: 'input',
        message: `This alias is linked to dataset <${linkedAlias.datasetName}>. Are you ABSOLUTELY sure you want to link this dataset alias to this dataset?
        \n  Type YES/NO: `,
        filter: (input) => `${input}`.toLowerCase(),
        validate: (input) => {
          return input === 'yes' || 'Ctrl + C to cancel dataset alias link.'
        },
      })
    }
  }

  try {
    await aliasClient.updateAlias(client, aliasName, datasetName)
    output.print(`Dataset alias ${aliasOutputName} linked to ${datasetName} successfully`)
  } catch (err) {
    throw new Error(`Dataset alias link failed:\n${err.message}`)
  }
}
