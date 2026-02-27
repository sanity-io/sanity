import {type CliCommandGroupDefinition} from '@sanity/cli'

const mediaGroup: CliCommandGroupDefinition = {
  name: 'media',
  signature: '[COMMAND]',
  description: 'Manage Media Library.',
  isGroupRoot: true,
}

export default mediaGroup
