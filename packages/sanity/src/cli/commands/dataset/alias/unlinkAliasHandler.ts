import type {CliCommandAction} from '@sanity/cli'
import {promptForDatasetAliasName} from '../../../actions/dataset/alias/promptForDatasetAliasName'
import {validateDatasetAliasName} from '../../../actions/dataset/alias/validateDatasetAliasName'
import * as aliasClient from './datasetAliasesClient'
import {ALIAS_PREFIX} from './datasetAliasesClient'

export const unlinkAliasHandler: CliCommandAction = async (args, context) => {
  const {apiClient, output, prompt} = context
  const [, alias] = args.argsWithoutOptions
  const client = apiClient()

  const nameError = alias && validateDatasetAliasName(alias)
  if (nameError) {
    throw new Error(nameError)
  }

  const fetchedAliases = await aliasClient.listAliases(client)

  let aliasName = await (alias || promptForDatasetAliasName(prompt))
  let aliasOutputName = aliasName

  if (aliasName.startsWith(ALIAS_PREFIX)) {
    aliasName = aliasName.substring(1)
  } else {
    aliasOutputName = `${ALIAS_PREFIX}${aliasName}`
  }

  // get the current alias from the remote alias list
  const linkedAlias = fetchedAliases.find((elem) => elem.name === aliasName)
  if (!linkedAlias) {
    throw new Error(`Dataset alias "${aliasOutputName}" does not exist`)
  }

  if (!linkedAlias.datasetName) {
    throw new Error(`Dataset alias "${aliasOutputName}" is not linked to a dataset`)
  }

  await prompt.single({
    type: 'input',
    message: `Are you ABSOLUTELY sure you want to unlink this alias from the "${linkedAlias.datasetName}" dataset?
      \n  Type YES/NO: `,
    filter: (input) => `${input}`.toLowerCase(),
    validate: (input) => {
      return input === 'yes' || 'Ctrl + C to cancel dataset alias unlink.'
    },
  })

  try {
    const result = await aliasClient.unlinkAlias(client, aliasName)
    output.print(
      `Dataset alias ${aliasOutputName} unlinked from ${result.datasetName} successfully`
    )
  } catch (err) {
    throw new Error(`Dataset alias unlink failed:\n${err.message}`)
  }
}
