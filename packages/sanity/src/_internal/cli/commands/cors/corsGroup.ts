import type {CliCommandGroupDefinition} from '@sanity/cli'

const corsGroup: CliCommandGroupDefinition = {
  name: 'cors',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Configures Cross-Origin Resource Sharing (CORS) settings for Sanity projects',
}

export default corsGroup
