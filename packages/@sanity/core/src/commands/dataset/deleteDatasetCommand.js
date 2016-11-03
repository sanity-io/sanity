export default {
  name: 'delete',
  group: 'dataset',
  signature: '[datasetName]',
  description: 'Delete a dataset within your project',
  action: (args, context) => {
    const {apiClient, output} = context
    const [dataset] = args.argsWithoutOptions
    if (!dataset) {
      throw new Error('Dataset name must be provided')
    }

    return apiClient().datasets.delete(dataset).then(() => {
      output.print('Dataset deleted successfully')
    })
  }
}
