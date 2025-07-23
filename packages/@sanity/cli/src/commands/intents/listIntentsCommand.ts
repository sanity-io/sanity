import {size} from 'lodash'

import {type CliCommandDefinition, type CliConfig} from '../../types'
import {getDashboardStoreId} from './utils/getDashboardStoreId'
import {queryDashboardStore} from './utils/queryDashboardStore'
import {type Intent} from './types'

const helpText = `
Options
  --organization <id>  Organization ID to use

Examples
  # List intents for organization (using organization ID in the app parameter in sanity.cli.ts)
  sanity intents list

  # List intents for specific organization
  sanity intents list --organization abc123
`

export interface ListIntentsFlags {
  organization?: string
}

const defaultFlags: ListIntentsFlags = {}

const listIntentsCommand: CliCommandDefinition<ListIntentsFlags> = {
  name: 'list',
  group: 'intents',
  signature: '[--organization <id>]',
  helpText,
  description: 'List available intents for an organization',
  action: async (args, context) => {
    const {output, cliConfig, apiClient, chalk} = context
    const flags = {...defaultFlags, ...args.extOptions}

    const configOrganizationId =
      cliConfig && 'app' in cliConfig ? (cliConfig as CliConfig).app?.organizationId : undefined

    const organizationId = flags.organization ?? configOrganizationId

    if (!organizationId) {
      throw new Error(
        'Organization ID is required. Provide it via an --organization flag or set it in your sanity.cli.ts config file under the app.organizationId property.',
      )
    }

    const dashboardStoreId = await getDashboardStoreId({
      apiClient,
      organizationId,
    })

    const intents = await queryDashboardStore<Intent>({
      apiClient,
      dashboardStoreId,
      query: `*[_type == "sanity.dashboard.intents"]`,
    })

    if (!intents || intents.length === 0) {
      output.print('No intents found for this organization.')
      return
    }

    const tableHeaders = ['ID', 'Application', 'Title']

    const rows = intents.map((intent: Intent) => [
      intent.id || 'N/A',
      intent.applicationId || 'N/A',
      intent.title || 'N/A',
    ])

    const maxWidths = rows.reduce(
      (max, row) => row.map((current, index) => Math.max(size(current), max[index])),
      tableHeaders.map((str) => size(str)),
    )

    const printRow = (row: string[]) =>
      row.map((col, i) => `${col}`.padEnd(maxWidths[i])).join('   ')

    output.print(chalk.cyan(printRow(tableHeaders)))
    rows.forEach((row) => output.print(printRow(row)))
  },
}

export default listIntentsCommand
