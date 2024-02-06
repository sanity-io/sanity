import type {CliCommandGroupDefinition} from '../../types'

const projectGroup: CliCommandGroupDefinition = {
  name: 'projects',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Lists all Sanity projects associated with your logged-in user account',
}

export default projectGroup
