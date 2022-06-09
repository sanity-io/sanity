import type {CliPrompter} from '@sanity/cli'
import {validateDatasetName} from './validateDatasetName'

export function promptForDatasetName(
  prompt: CliPrompter,
  options: {message?: string; default?: string} = {}
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
