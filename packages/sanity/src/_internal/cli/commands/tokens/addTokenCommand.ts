import {type CliCommandDefinition} from '@sanity/cli'

import {addToken} from '../../actions/tokens/addToken'

const helpText = `
Examples
  sanity tokens add "My API Token"
  sanity tokens add "My API Token" --role=editor
  sanity tokens add "My API Token" --role=viewer
  sanity tokens add "CI Token" --role=editor --yes
  sanity tokens add "API Token" --json

Options
  --role <role>     Role to assign to the token. Default: viewer
  --json            JSON output format
  -y, --yes         Skip prompts and use defaults (unattended mode)
`

type AddTokenFlags = {
  role?: string
  yes?: boolean
  y?: boolean
  json?: boolean
}

const addTokenCommand: CliCommandDefinition<AddTokenFlags> = {
  name: 'add',
  group: 'tokens',
  signature: '[LABEL]',
  helpText,
  description: 'Create a new API token for this project',
  action: async (args, context) => {
    const {output} = context
    const [label] = args.argsWithoutOptions
    const {role, yes, y, json} = args.extOptions

    const outputJson = json || false

    try {
      const token = await addToken(label, {role, unattended: Boolean(yes || y)}, context)

      if (outputJson) {
        output.print(JSON.stringify(token, null, 2))
        return
      }

      output.print(`Token created successfully!`)
      output.print(`Label: ${token.label}`)
      output.print(`ID: ${token.id}`)
      output.print(`Role: ${token.roles.map((r) => r.title).join(', ')}`)
      output.print(`Token: ${token.key}`)
      output.print('')
      output.print('Copy the token above – this is your only chance to do so!')
    } catch (err) {
      throw new Error(`Token creation failed:\n${err.message}`, {cause: err})
    }
  },
}

export default addTokenCommand
