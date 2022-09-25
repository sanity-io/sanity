import type {CliCommandGroupDefinition} from '@sanity/cli'

const hookGroup: CliCommandGroupDefinition = {
  name: 'hook',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Interact with hooks in your project',
}

export default hookGroup
