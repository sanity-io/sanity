import {deleteToken} from '../../actions/token/deleteToken'
import {type CliCommandDefinition} from '../../types'

const tokenDeleteCommand: CliCommandDefinition = {
  name: 'delete',
  group: 'token',
  signature: '[id]',
  helpText: 'Delete an API token from project',
  description: 'Delete an API token from project',
  action: deleteToken,
}

export default tokenDeleteCommand
