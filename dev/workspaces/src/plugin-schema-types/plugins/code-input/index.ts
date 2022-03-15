import {SanityPlugin} from '@sanity/base'
import {CodeInput} from './CodeInput'

export function codeInput(): SanityPlugin {
  return {
    name: '@sanity/code-input',
    schemaTypes: [
      {
        type: 'object',
        name: 'code',
        title: 'Code',
        inputComponent: CodeInput,
        fields: [
          {
            type: 'string',
            name: 'language',
            title: 'Language',
          },
          {
            type: 'text',
            name: 'raw',
            title: 'Code',
          },
        ],
      },
    ],
  }
}
