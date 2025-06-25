import {type CliCommandDefinition} from '@sanity/cli'
import {deleteToken} from '../../actions/tokens/deleteToken'

const helpText = `
Examples
  sanity tokens delete
  sanity tokens delete silJ2lFmK6dONB
  sanity tokens delete "My API Token"

Options
  --force Skip confirmation prompt
`

const deleteTokenCommand: CliCommandDefinition = {
  name: 'delete',
  group: 'tokens',
  signature: '[TOKEN]',
  helpText,
  description: 'Delete an API token from this project',
  action: async (args, context) => {
    const {output} = context
    const [token] = args.argsWithoutOptions
    const {force} = args.extOptions as {force?: boolean}

    try {
      const success = await deleteToken(token, {force}, context)
      if (success) {
        output.print('Token deleted successfully')
      }
    } catch (err) {
      throw new Error(`Token deletion failed:\n${err.message}`)
    }
  },
}

export default deleteTokenCommand
