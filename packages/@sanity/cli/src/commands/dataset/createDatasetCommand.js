import createDataset from '../../actions/dataset/createDataset'

export default {
  name: 'dataset create',
  signature: 'dataset create',
  description: 'Create a new dataset within your organization',
  action: (args, opts) => {
    return (args.options._[1]
      ? Promise.resolve(args.options._[1])
      : promptForDatasetName(args.prompt)
    ).then(createDataset)
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
