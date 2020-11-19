import promptForDatasetAliasName from '../../actions/dataset-alias/datasetAliasNamePrompt'
import validateDatasetAliasName from '../../actions/dataset-alias/validateDatasetAliasName'
import * as aliasClient from './datasetAliasesClient'

const helpText = `
Examples
  sanity dataset-alias unlink
  sanity dataset-alias unlink <alias-name>
`

export default {
  name: 'unlink',
  group: 'dataset-alias',
  signature: '[NAME]',
  helpText,
  description: 'Unlink a dataset from the dataset alias within your project',
  action: async (args, context) => {
    const {apiClient, output, prompt} = context
    const [alias] = args.argsWithoutOptions
    const client = apiClient()

    const nameError = alias && validateDatasetAliasName(alias)
    if (nameError) {
      throw new Error(nameError)
    }

    const [aliases] = await Promise.all([
      aliasClient.list(client).then(sets => sets.map(ds => ds.name))
    ])

    const aliasName = await (alias || promptForDatasetAliasName(prompt))
    if (!aliases.includes(aliasName)) {
      throw new Error(`Dataset alias "${aliasName}" does not exist `)
    }

    try {
      const result = await aliasClient.unlink(client, aliasName)
      output.print(`Dataset alias ${aliasName} unlinked from ${result.datasetName} successfully`)
    } catch (err) {
      throw new Error(`Dataset alias link failed:\n${err.message}`)
    }
  }
}
