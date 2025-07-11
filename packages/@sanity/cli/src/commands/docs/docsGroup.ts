import {type CliCommandGroupDefinition} from '../../types'

const docsGroup: CliCommandGroupDefinition = {
  name: 'docs',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Search, read, and browse Sanity documentation',
}

export default docsGroup
