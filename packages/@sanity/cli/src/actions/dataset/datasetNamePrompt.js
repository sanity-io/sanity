const datasetNameError = (
  'Dataset names can only contain lowercase characters,'
  + 'numbers, underscores and dashes'
  + 'and can be at most 128 characters.'
)

export default function promptForDatasetName(prompt, options = {}) {
  return prompt.single({
    type: 'input',
    message: 'Dataset name:',
    validate: name => {
      return /^[-\w]{1,128}$/.test(name) || datasetNameError
    },
    ...options
  })
}
