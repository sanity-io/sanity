import promptForDatasetAliasName from '../../../actions/alias/datasetAliasNamePrompt'
import validateDatasetAliasName from '../../../actions/alias/validateDatasetAliasName'

const helpText = `
Examples
  sanity dataset-alias unlink
  sanity dataset-alias unlink <name>
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
      client.datasetAliases.list().then(sets => sets.map(ds => ds.name))
    ])

    const aliasName = await (alias || promptForDatasetAliasName(prompt))
    if (!aliases.includes(aliasName)) {
      throw new Error(`Dataset alias "${aliasName}" does not exist `)
    }

    try {
      const rsp = await client.datasetAliases.unlink(aliasName)
      console.log(rsp)
      output.print(`Dataset alias ${aliasName} unlinked from successfully`)
    } catch (err) {
      throw new Error(`Dataset alias link failed:\n${err.message}`)
    }
  }
}
