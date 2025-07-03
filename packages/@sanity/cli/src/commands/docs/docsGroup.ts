import {type CliCommandGroupDefinition} from '../../types'

const docsGroup: CliCommandGroupDefinition = {
  name: 'docs',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Access Sanity documentation',
}

export default docsGroup
