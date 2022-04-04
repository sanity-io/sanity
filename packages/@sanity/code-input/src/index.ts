import {createPlugin} from '@sanity/base'
import schema from './schema'

export const codeInput = createPlugin({
  name: '@sanity/code-input',
  schema: {types: [schema]},
})
