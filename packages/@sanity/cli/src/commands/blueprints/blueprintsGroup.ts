import {type CliCommandGroupDefinition} from '../../types'

const blueprintsGroup: CliCommandGroupDefinition = {
  name: 'blueprints',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Deploy and manage Sanity Blueprints and Stacks (IaC)',
}

export default blueprintsGroup
