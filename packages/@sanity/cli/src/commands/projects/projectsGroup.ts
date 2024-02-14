import {type CliCommandGroupDefinition} from '../../types'

const projectGroup: CliCommandGroupDefinition = {
  name: 'projects',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Lists all projects associated with your logged-in account',
}

export default projectGroup
