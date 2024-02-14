import {type CliCommandGroupDefinition} from '@sanity/cli'

const documentsGroup: CliCommandGroupDefinition = {
  name: 'documents',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manages documents in your Sanity Content Lake datasets',
}

export default documentsGroup
