import chalk from 'chalk'
import type {CliPrompter} from '../../types'

const MAX_DATASET_NAME_LENGTH = 64

const datasetNameError =
  'Dataset names can only contain lowercase characters,' +
  'numbers, underscores and dashes' +
  `and can be at most ${MAX_DATASET_NAME_LENGTH} characters.`

export function promptForDatasetName(
  prompt: CliPrompter,
  options: {message?: string} = {},
  existingDatasets: string[] = []
): Promise<string> {
  return prompt.single({
    type: 'input',
    message: 'Dataset name:',
    validate: (name) => {
      if (existingDatasets.includes(name)) {
        return 'Dataset name already exists'
      }

      if (!name || name.length < 2 || name.length > MAX_DATASET_NAME_LENGTH) {
        return `Dataset name must be between 2 and ${MAX_DATASET_NAME_LENGTH} characters`
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
        ? `Disallowed characters found: ${formatInvalid(name, invalid)}`
        : datasetNameError
    },
    ...options,
  })
}

function formatInvalid(name: string, invalid: string[]): string {
  return invalid.reduce(
    (acc, char) => acc.replace(new RegExp(escapeRegex(char), 'g'), chalk.red.bold(char)),
    name
  )
}

function escapeRegex(str: string): string {
  return `${str}`.replace(/([?!${}*:()|=^[\]/\\.+])/g, '\\$1')
}
