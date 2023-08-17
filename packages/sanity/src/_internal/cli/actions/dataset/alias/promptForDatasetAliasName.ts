import type {CliPrompter} from '@sanity/cli'
import {validateDatasetAliasName} from './validateDatasetAliasName'

export function promptForDatasetAliasName(
  prompt: CliPrompter,
  options: {message?: string; default?: string} = {},
): Promise<string> {
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
