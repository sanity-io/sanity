export default {
  name: 'delete',
  command: 'delete [datasetName]',
  describe: 'Delete a dataset within your project',
  action: ({apiClient, options, prompt}) => {
    const client = apiClient()
    const name = options.datasetName

    if (!name) {
      throw new Error('Dataset name must be provided')
    }

    client.deleteDataset(name)
  }
}
