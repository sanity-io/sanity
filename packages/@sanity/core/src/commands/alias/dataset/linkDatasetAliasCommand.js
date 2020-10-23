import promptForDatasetName from '../../../actions/dataset/datasetNamePrompt'
import promptForDatasetAliasName from '../../../actions/alias/datasetAliasNamePrompt'
import validateDatasetAliasName from '../../../actions/alias/validateDatasetAliasName'
import validateDatasetName from '../../../actions/dataset/validateDatasetName'

const helpText = `
Examples
  sanity alias dataset link
  sanity alias dataset link <name>
  sanity alias dataset link <name> <target-dataset>
`

export default {
  name: 'link',
  group: 'dataset',
  signature: '[NAME, TARGET_DATASET]',
  helpText,
  description: 'Create a new dataset alias within your project',
  action: async (args, context) => {
    const {apiClient, output, prompt} = context
    const [alias, targetDataset] = args.argsWithoutOptions
    const client = apiClient()

    const nameError = alias && validateDatasetAliasName(alias)
    if (nameError) {
      throw new Error(nameError)
    }

    const [datasets, aliases] = await Promise.all([
      client.datasets.list().then(sets => sets.map(ds => ds.name)),
      client.datasetAliases.list().then(sets => sets.map(ds => ds.name))
    ])

    const aliasName = await (alias || promptForDatasetAliasName(prompt))
    if (!aliases.includes(aliasName)) {
      throw new Error(`Dataset alias "${aliasName}" does not exist `)
    }

    const datasetName = await (targetDataset || promptForDatasetName(prompt))
    const datasetErr = validateDatasetName(datasetName)
    if (datasetErr) {
      throw new Error(datasetErr)
    }

    if (!datasets.includes(datasetName)) {
      throw new Error(`Dataset "${datasetName}" does not exist `)
    }

    try {
      await client.datasetAliases.update(aliasName, {datasetName})
      output.print(`Dataset alias ${aliasName} linked to ${datasetName} successfully`)
    } catch (err) {
      throw new Error(`Dataset alias link failed:\n${err.message}`)
    }
  }
}
