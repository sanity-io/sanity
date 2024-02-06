import type {CliCommandGroupDefinition} from '@sanity/cli'

const documentsGroup: CliCommandGroupDefinition = {
  name: 'documents',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manages and interacts with documents in your Sanity Content Lake datasets',
}

export default documentsGroup
