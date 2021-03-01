import validateDatasetName from './validateDatasetName'

export default function promptForDatasetName(prompt, options = {}) {
  return prompt.single({
    type: 'input',
    message: 'Dataset name:',
    validate: (name) => {
      const err = validateDatasetName(name)
      if (err) {
        return err
      }

      return true
    },
    ...options,
  })
}
