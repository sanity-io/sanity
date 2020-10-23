import chalk from 'chalk'

const datasetNameError =
  'Dataset names can only contain lowercase characters,' +
  'numbers, underscores and dashes' +
  'and can be at most 20 characters.'

export default function promptForDatasetName(prompt, options = {}, existingDatasets = []) {
  return prompt.single({
    type: 'input',
    message: 'Dataset name:',
    validate: (name) => {
      if (existingDatasets.includes(name)) {
        return `Dataset name already exists`
      }

      if (!name || name.length < 2 || name.length > 20) {
        return 'Dataset name must be between 2 and 20 characters'
      }

      if (name.toLowerCase() !== name) {
        return 'Dataset name must be lowercase'
      }

      if (name.replace(/\s/g, '') !== name) {
        return 'Dataset name cannot contain whitespace'
      }

      if (/^[^a-z0-9]/.test(name)) {
        return 'Dataset name must start with a character or letter'
      }

      if (/[-_]$/.test(name)) {
        return 'Dataset name must not end with a dash or an underscore'
      }

      const isValid = /^[a-z0-9][-\w]+$/.test(name)
      if (isValid) {
        return true
      }

      const invalid = name.match(/[^-\w]/g) || []
      return invalid.length > 0
        ? `Disallowed characters found: ${printInvalid(name, invalid)}`
        : datasetNameError
    },
    ...options,
  })
}

function printInvalid(name, invalid) {
  return invalid.reduce(
    (acc, char) => acc.replace(new RegExp(escapeRegex(char), 'g'), chalk.red.bold(char)),
    name
  )
}

function escapeRegex(string) {
  return `${string}`.replace(/([?!${}*:()|=^[\]/\\.+])/g, '\\$1')
}
