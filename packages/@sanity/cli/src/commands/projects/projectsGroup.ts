import type {CliCommandGroupDefinition} from '../../types'

const projectGroup: CliCommandGroupDefinition = {
  name: 'projects',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Interact with projects connected to your logged in user',
}

export default projectGroup
