import {type CliCommandGroupDefinition} from '../../types'

const projectGroup: CliCommandGroupDefinition = {
  name: 'projects',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manage Sanity projects - list, create',
}

export default projectGroup
