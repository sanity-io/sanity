import promptForDatasetName from '../../actions/dataset/datasetNamePrompt'

export default {
  name: 'create',
  command: 'create [datasetName]',
  describe: 'Create a new dataset within your project',
  action: ({apiClient, options, prompt}) => {
    const client = apiClient()
    return (options.datasetName
      ? Promise.resolve(options.datasetName)
      : promptForDatasetName(prompt)
    ).then(name => client.createDataset(name))
  }
}

