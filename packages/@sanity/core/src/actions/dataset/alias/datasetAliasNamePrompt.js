import validateDatasetAliasName from './validateDatasetAliasName'

export default function promptForAliasName(prompt, options = {}) {
  return prompt.single({
    type: 'input',
    message: 'Alias name:',
    validate: (name) => {
      const err = validateDatasetAliasName(name)
      if (err) {
        return err
      }

      return true
    },
    ...options,
  })
}
