import {createPlugin, SanityPlugin} from '@sanity/base'
import schema from './schema'

export function codeInput(): SanityPlugin {
  return createPlugin({
    name: '@sanity/code-input',
    schemaTypes: [schema],
  })
}
