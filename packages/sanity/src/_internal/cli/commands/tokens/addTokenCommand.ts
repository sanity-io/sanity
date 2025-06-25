import {type CliCommandDefinition} from '@sanity/cli'
import {addToken} from '../../actions/tokens/addToken'

const helpText = `
Examples
  sanity tokens add "My API Token"
  sanity tokens add "My API Token" --role=editor
  sanity tokens add "My API Token" --role=viewer

Options
  --role <role> Role to assign to the token. Default: editor
`

const addTokenCommand: CliCommandDefinition = {
  name: 'add',
  group: 'tokens',
  signature: '[LABEL]',
  helpText,
  description: 'Create a new API token for this project',
  action: async (args, context) => {
    const {output} = context
    const [label] = args.argsWithoutOptions
    const {role} = args.extOptions as {role?: string}

    try {
      const token = await addToken(label, {role}, context)
      output.print(`Token created successfully!`)
      output.print(`Label: ${token.label}`)
      output.print(`Role: ${token.roles.map((r) => r.title).join(', ')}`)
      output.print(`Token: ${token.key}`)
      output.print('')
      output.print('⚠️  WARNING: This token will only be shown once. Store it securely!')
    } catch (err) {
      throw new Error(`Token creation failed:\n${err.message}`)
    }
  },
}

export default addTokenCommand
