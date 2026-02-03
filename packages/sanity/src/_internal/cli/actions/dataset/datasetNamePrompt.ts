import {validateDatasetName} from './validateDatasetName'
import {type CliPrompter} from '@sanity/cli'

export function promptForDatasetName(
  prompt: CliPrompter,
  options: {message?: string; default?: string} = {},
): Promise<string> {
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
