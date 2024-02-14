import {type CliCommandGroupDefinition} from '@sanity/cli'

const hookGroup: CliCommandGroupDefinition = {
  name: 'hook',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Sets up and manages webhooks within your Sanity project',
}

export default hookGroup
