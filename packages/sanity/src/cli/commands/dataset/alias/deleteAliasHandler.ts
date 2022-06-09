import type {CliCommandAction} from '@sanity/cli'
import {validateDatasetAliasName} from '../../../actions/dataset/alias/validateDatasetAliasName'
import * as aliasClient from './datasetAliasesClient'
import {ALIAS_PREFIX} from './datasetAliasesClient'

export const deleteAliasHandler: CliCommandAction = async (args, context) => {
  const {apiClient, prompt, output} = context
  const [, ds] = args.argsWithoutOptions
  const client = apiClient()
  if (!ds) {
    throw new Error('Dataset alias name must be provided')
  }

  let aliasName = `${ds}`
  const dsError = validateDatasetAliasName(aliasName)
  if (dsError) {
    throw dsError
  }
  aliasName = aliasName.startsWith(ALIAS_PREFIX) ? aliasName.substring(1) : aliasName

  const [fetchedAliases] = await Promise.all([aliasClient.listAliases(client)])
  const linkedAlias = fetchedAliases.find((elem) => elem.name === aliasName)
  const message =
    linkedAlias && linkedAlias.datasetName
      ? `This dataset alias is linked to ${linkedAlias.datasetName}. `
      : ''

  await prompt.single({
    type: 'input',
    message: `${message}Are you ABSOLUTELY sure you want to delete this dataset alias?\n  Type the name of the dataset alias to confirm delete: `,
    filter: (input) => `${input}`.trim(),
    validate: (input) => {
      return input === aliasName || 'Incorrect dataset alias name. Ctrl + C to cancel delete.'
    },
  })

  // Strip out alias prefix if it exist in the string
  aliasName = aliasName.startsWith(ALIAS_PREFIX) ? aliasName.substring(1) : aliasName

  return aliasClient.removeAlias(client, aliasName).then(() => {
    output.print('Dataset alias deleted successfully')
  })
}
