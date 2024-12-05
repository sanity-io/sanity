import {type CliCommandGroupDefinition} from '../../types'

const tokenGroup: CliCommandGroupDefinition = {
  name: 'token',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manages project API tokens',
}

export default tokenGroup
