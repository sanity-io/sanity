import {listTokens} from '../../actions/token/listTokens'
import {type CliCommandDefinition} from '../../types'

type Token = {
  id: string
  label: string
  projectUserId: string
  createdAt: string
  roles: Array<{
    name: string
    title: string
  }>
}

const tokenListCommand: CliCommandDefinition = {
  name: 'list',
  group: 'token',
  signature: '',
  helpText: 'List all API tokens in project',
  description: 'List all API tokens in project',
  action: listTokens,
}

export default tokenListCommand
