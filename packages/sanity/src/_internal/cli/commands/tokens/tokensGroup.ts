import {type CliCommandGroupDefinition} from '@sanity/cli'

const tokensGroup: CliCommandGroupDefinition = {
  name: 'tokens',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manages API tokens for Sanity projects',
}

export default tokensGroup
