import type {CliCommandGroupDefinition} from '@sanity/cli'

const documentsGroup: CliCommandGroupDefinition = {
  name: 'documents',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Interact with documents in your project',
}

export default documentsGroup
