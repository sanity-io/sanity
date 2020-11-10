import promptForDatasetName from '../../../actions/alias/datasetNamePrompt'
import promptForDatasetAliasName from '../../../actions/alias/datasetAliasNamePrompt'
import validateDatasetAliasName from '../../../actions/alias/validateDatasetAliasName'
import validateDatasetName from '../../../actions/dataset/validateDatasetName'

const helpText = `
Examples
  sanity dataset-alias create
  sanity dataset-alias create <name>
  sanity dataset-alias create <name> <target-dataset>
`

export default {
  name: 'create',
  group: 'dataset-alias',
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

    const [datasets, aliases, projectFeatures] = await Promise.all([
      client.datasets.list().then(sets => sets.map(ds => ds.name)),
      client.datasetAliases.list().then(sets => sets.map(ds => ds.name)),
      client.request({uri: '/features'})
    ])

    const aliasName = await (alias || promptForDatasetAliasName(prompt))
    if (aliases.includes(aliasName)) {
      throw new Error(`Dataset alias "${aliasName}" already exists`)
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
      await client.datasetAliases.create(aliasName, {datasetName})
      output.print(`Dataset alias ${aliasName} created successfully`)
    } catch (err) {
      throw new Error(`Dataset alias creation failed:\n${err.message}`)
    }
  }
}
