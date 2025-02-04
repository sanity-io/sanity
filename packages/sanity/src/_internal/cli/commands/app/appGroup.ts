import {type CliCommandGroupDefinition} from '@sanity/cli'

const appGroup: CliCommandGroupDefinition = {
  name: 'app',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manages non-studio applications',
}

export default appGroup
