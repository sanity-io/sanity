import {type CliCommandDefinition} from '@sanity/cli'
import {Table} from 'console-table-printer'

import {type Token} from './types'

const helpText = `
Examples
  sanity tokens list
  sanity tokens list --json

Options
  --json            JSON output format
`

type ListTokensFlags = {
  json?: boolean
}

const listTokensCommand: CliCommandDefinition<ListTokensFlags> = {
  name: 'list',
  group: 'tokens',
  signature: '',
  helpText,
  description: 'List all API tokens for this project',
  action: async (args, context) => {
    const {output, apiClient} = context
    const {json} = args.extOptions
    const outputJson = json || false
    const client = apiClient({requireUser: true, requireProject: true}).config({
      apiVersion: '2021-06-07',
    })

    try {
      const config = client.config()
      const tokens = await client.request<Token[]>({url: `/projects/${config.projectId}/tokens`})

      if (outputJson) {
        output.print(JSON.stringify(tokens, null, 2))
        return
      }

      if (tokens.length === 0) {
        output.print('No tokens found')
        return
      }

      const table = new Table({
        title: `Found ${tokens.length} API tokens`,
        columns: [
          {name: 'label', title: 'Label', alignment: 'left', maxLen: 50},
          {name: 'id', title: 'Token ID', alignment: 'left', maxLen: 20},
          {name: 'roles', title: 'Roles', alignment: 'left', maxLen: 30},
        ],
      })

      tokens.forEach((token) => {
        const roles = token.roles?.map((role) => role.title).join(', ') || 'No roles'
        const truncatedLabel =
          token.label.length > 47 ? `${token.label.slice(0, 47)}...` : token.label
        const truncatedRoles = roles.length > 27 ? `${roles.slice(0, 27)}...` : roles

        table.addRow({
          label: truncatedLabel,
          id: token.id,
          roles: truncatedRoles,
        })
      })

      table.printTable()
    } catch (err) {
      throw new Error(`Failed to list tokens:\n${err.message}`, {cause: err})
    }
  },
}

export default listTokensCommand
