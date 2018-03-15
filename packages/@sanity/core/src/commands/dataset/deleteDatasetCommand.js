export default {
  name: 'delete',
  group: 'dataset',
  signature: '[datasetName]',
  description: 'Delete a dataset within your project',
  action: async (args, context) => {
    const {apiClient, prompt, output} = context
    const [ds] = args.argsWithoutOptions
    if (!ds) {
      throw new Error('Dataset name must be provided')
    }

    const dataset = `${ds}`

    await prompt.single({
      type: 'input',
      message:
        'Are you ABSOLUTELY sure you want to delete this dataset?\n  Type the name of the dataset to confirm delete:',
      validate: input => {
        return input === dataset || 'Incorrect dataset name. Ctrl + C to cancel delete.'
      }
    })

    return apiClient()
      .datasets.delete(dataset)
      .then(() => {
        output.print('Dataset deleted successfully')
      })
  }
}
