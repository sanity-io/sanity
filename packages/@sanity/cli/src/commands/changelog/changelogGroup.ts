import {type CliCommandGroupDefinition} from '../../types'

const changelogGroup: CliCommandGroupDefinition = {
  name: 'changelog',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'View and search Sanity changelog entries',
}

export default changelogGroup
