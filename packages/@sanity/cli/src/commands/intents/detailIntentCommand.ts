import {type CliCommandDefinition, type CliConfig} from '../../types'
import {type Intent} from './types'
import {getDashboardStoreId} from './utils/getDashboardStoreId'
import {queryDashboardStore} from './utils/queryDashboardStore'

const helpText = `
Arguments
  <intentId>  The ID of the intent to show details for

Options
  --organization <id>  Organization ID to use

Examples
  # Show details for a specific intent (using organization ID in sanity.cli.ts)
  sanity intents detail myIntentId

  # Show details for specific intent with organization ID
  sanity intents detail myIntentId --organization abc123
`

export interface DetailIntentFlags {
  organization?: string
}

const defaultFlags: DetailIntentFlags = {}

const detailIntentCommand: CliCommandDefinition<DetailIntentFlags> = {
  name: 'detail',
  group: 'intents',
  signature: '<intentId> [--organization <id>]',
  helpText,
  description: 'Show detailed information about a specific intent',
  action: async (args, context) => {
    const {output, cliConfig, apiClient, chalk} = context
    const flags = {...defaultFlags, ...args.extOptions}
    const intentId = args.argsWithoutOptions[0]

    if (!intentId) {
      throw new Error('Intent ID is required. Usage: sanity intents detail <intentId>')
    }

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
      query: `*[_type == "sanity.dashboard.intents" && id == "${intentId}"]`,
    })

    if (!intents || intents.length === 0) {
      output.print(`No intent found with ID: ${intentId}`)
      return
    }

    const intent = intents[0]

    // Display detailed information
    output.print(chalk.cyan.bold('Intent Details'))
    output.print('')
    output.print(`${chalk.bold('ID:')} ${intent.id}`)
    output.print(`${chalk.bold('Title:')} ${intent.title}`)
    output.print(`${chalk.bold('Application:')} ${intent.applicationId}`)
    output.print(`${chalk.bold('Action:')} ${intent.action}`)

    if (intent.description) {
      output.print(`${chalk.bold('Description:')} ${intent.description}`)
    }

    output.print('')
    output.print(chalk.cyan.bold('Filters'))

    if (intent.filters && intent.filters.length > 0) {
      intent.filters.forEach((filter, index) => {
        output.print(`${chalk.bold(`Filter ${index + 1}:`)}`)
        if (filter.projectId) {
          output.print(`  ${chalk.bold('Project ID:')} ${filter.projectId}`)
        }
        if (filter.dataset) {
          output.print(`  ${chalk.bold('Dataset:')} ${filter.dataset}`)
        }
        if (filter.types && filter.types.length > 0) {
          output.print(`  ${chalk.bold('Types:')} ${filter.types.join(', ')}`)
        }
        if (index < intent.filters.length - 1) {
          output.print('')
        }
      })
    } else {
      output.print('No filters defined')
    }
  },
}

export default detailIntentCommand
