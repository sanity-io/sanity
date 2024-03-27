import {type CliCommandGroupDefinition} from '../../types'

const typegenGroup: CliCommandGroupDefinition = {
  name: 'typegen',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Beta: Generate TypeScript types for schema and GROQ',
}

export default typegenGroup
