import {createPlugin} from '@sanity/base'
import schema from './schema'

export type {CodeInputProps, CodeSchemaType} from './CodeInput'

export type {CodeInputLanguage, CodeInputValue} from './types'

export const codeInput = createPlugin({
  name: '@sanity/code-input',
  schema: {types: [schema]},
})
