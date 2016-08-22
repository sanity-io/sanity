export default {
  name: 'create',
  command: 'create [datasetName]',
  describe: 'Create a new dataset within your project',
  action: ({apiClient, options, prompt}) => {
    const client = apiClient()
    return (options.datasetName
      ? Promise.resolve({name: options.datasetName})
      : promptForDatasetName(prompt)
    ).then(info => client.createDataset(info.name))
  }
}

const datasetNameError = (
  'Dataset names can only contain lowercase characters,'
  + 'numbers, underscores and dashes'
  + 'and can be at most 128 characters.'
)

function promptForDatasetName(prompt) {
  return prompt([{
    type: 'input',
    name: 'name',
    message: `Dataset name:`,
    validate: name => {
      return /^[-\w]{1,128}$/.test(name) || datasetNameError
    }
  }])
}
