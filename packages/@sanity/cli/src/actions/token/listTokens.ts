import Table from 'cli-table3'

import {type CliCommandArguments, type CliCommandContext} from '../../types'
import {fetchTokens, selectProject} from './tokenUtils'

export async function listTokens(
  args: CliCommandArguments,
  context: CliCommandContext,
): Promise<void> {
  const {output, cliConfig, prompt, apiClient} = context
  const {print} = output
  const client = apiClient({requireUser: true, requireProject: false})

  const projectId = cliConfig?.api?.projectId || (await selectProject(client, prompt))
  const tokens = await fetchTokens(client, projectId)

  if (tokens.length === 0) {
    print('No tokens found in project')
    return
  }

  const sortedTokens = tokens.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const table = new Table({
    head: ['ID', 'Label', 'Roles', 'Created'],
    colWidths: [16, 32, 18, 14],
    style: {head: []}, // Remove the default header style
  })

  for (const token of sortedTokens) {
    const roles = token.roles.map((role) => role.title).join(', ')
    const date = new Date(token.createdAt).toLocaleDateString()
    table.push([token.id, token.label, roles, date])
  }

  print(table.toString())
}
