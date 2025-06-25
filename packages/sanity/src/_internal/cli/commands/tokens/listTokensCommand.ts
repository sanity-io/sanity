import {type CliCommandDefinition} from '@sanity/cli'
import {type Token} from './types'

const helpText = `
Examples
  sanity tokens list
  sanity tokens list --format=json

Options
  --format <format> Output format (table, json). Default: table
`

const listTokensCommand: CliCommandDefinition = {
  name: 'list',
  group: 'tokens',
  signature: '',
  helpText,
  description: 'List all API tokens for this project',
  action: async (args, context) => {
    const {output, apiClient} = context
    const {format} = args.extOptions as {format?: string}
    const client = apiClient({requireUser: true, requireProject: true})

    try {
      const tokens = await client.request<Token[]>({url: '/tokens'})

      if (format === 'json') {
        output.print(JSON.stringify(tokens, null, 2))
        return
      }

      if (tokens.length === 0) {
        output.print('No tokens found')
        return
      }

      output.print('API Tokens:')
      tokens.forEach((token) => {
        const roles = token.roles.map((role) => role.title).join(', ')
        output.print(`  ${token.label} (${token.id}) - ${roles}`)
      })
    } catch (err) {
      throw new Error(`Failed to list tokens:\n${err.message}`)
    }
  },
}

export default listTokensCommand
