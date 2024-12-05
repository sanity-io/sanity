import {createToken} from '../../actions/token/createToken'
import {type CliCommandDefinition} from '../../types'

const tokenCommand: CliCommandDefinition = {
  name: 'create',
  group: 'token',
  signature: '',
  helpText: 'Create a new API token for project',
  description: 'Create a new API token for project',
  action: createToken,
}

export default tokenCommand
