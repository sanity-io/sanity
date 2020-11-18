import validateDatasetAliasName from '../../actions/dataset-alias/validateDatasetAliasName'

const helpText = `
Examples
  sanity dataset-alias delete <alias-name>
`
export default {
  name: 'delete',
  group: 'dataset-alias',
  signature: '[aliasName]',
  helpText,
  description: 'Delete a dataset alias within your project',
  action: async (args, context) => {
    const {apiClient, prompt, output} = context
    const [ds] = args.argsWithoutOptions
    if (!ds) {
      throw new Error('Dataset alias name must be provided')
    }

    const alias = `${ds}`
    const dsError = validateDatasetAliasName(alias)
    if (dsError) {
      throw dsError
    }

    await prompt.single({
      type: 'input',
      message:
        'Are you ABSOLUTELY sure you want to delete this dataset alias?\n  Type the name of the dataset alias to confirm delete:',
      filter: input => `${input}`.trim(),
      validate: input => {
        return input === alias || 'Incorrect dataset alias name. Ctrl + C to cancel delete.'
      }
    })

    return apiClient()
      .datasetAliases.delete(alias)
      .then(() => {
        output.print('Dataset alias deleted successfully')
      })
  }
}
