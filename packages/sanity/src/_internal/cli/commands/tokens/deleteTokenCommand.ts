import {type CliCommandDefinition} from '@sanity/cli'

import {deleteToken} from '../../actions/tokens/deleteToken'

const helpText = `
Examples
  sanity tokens delete
  sanity tokens delete silJ2lFmK6dONB
  sanity tokens delete silJ2lFmK6dONB --yes

Options
  -y, --yes     Skip confirmation prompt (unattended mode)

Note: When specifying a token, you must use the token ID, not the label.
`

const deleteTokenCommand: CliCommandDefinition = {
  name: 'delete',
  group: 'tokens',
  signature: '[TOKEN_ID]',
  helpText,
  description: 'Delete an API token from this project',
  action: async (args, context) => {
    const {output} = context
    const [token] = args.argsWithoutOptions
    const {yes, y} = args.extOptions as {yes?: boolean; y?: boolean}

    try {
      const success = await deleteToken(token, {unattended: Boolean(yes || y)}, context)
      if (success) {
        output.print('Token deleted successfully')
      }
    } catch (err) {
      throw new Error(`Token deletion failed:\n${err.message}`, {cause: err})
    }
  },
}

export default deleteTokenCommand
