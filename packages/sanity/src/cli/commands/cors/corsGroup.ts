import type {CliCommandGroupDefinition} from '@sanity/cli'

const corsGroup: CliCommandGroupDefinition = {
  name: 'cors',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Interact with CORS-entries for your project',
}

export default corsGroup
