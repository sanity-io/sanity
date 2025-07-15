import {type CliCommandDefinition, type CliConfig} from '../../types'
import {loadIntentFile} from './utils/loadIntentFile'
import {getDashboardStoreId} from '../../commands/intents/utils/getDashboardStoreId'
import {queryDashboardStore} from '../../commands/intents/utils/queryDashboardStore'
import {Intent} from '../../commands/intents/types'

export interface AddIntentFlags {
  force?: boolean
  organization?: string
}

export const addIntent: CliCommandDefinition<AddIntentFlags>['action'] = async (args, context) => {
  const {output, cliConfig, apiClient, prompt} = context
  const [filePath] = args.argsWithoutOptions
  const flags = args.extOptions

  if (!filePath) {
    throw new Error('File path is required')
  }

  // Get organization ID from CLI config or command line flag
  const configOrganizationId =
    cliConfig && 'app' in cliConfig ? (cliConfig as CliConfig).app?.organizationId : undefined

  const organizationId = flags.organization ?? configOrganizationId

  if (!organizationId) {
    throw new Error(
      'Organization ID is required. Provide it via an --organization flag or set it in your sanity.cli.ts config file under the app.organizationId property.',
    )
  }

  output.print(`Adding intent from file: ${filePath}`)

  try {
    // Load and validate the intent file
    const spinner = output.spinner('Loading intent file').start()
    const intentDefinition = await loadIntentFile(filePath)
    spinner.succeed(`Intent loaded: ${intentDefinition.title}`)

    // Get dashboard store ID
    const dashboardSpinner = output.spinner('Getting dashboard store ID').start()
    const dashboardStoreId = await getDashboardStoreId({
      apiClient,
      organizationId,
    })
    dashboardSpinner.succeed('Dashboard store ID retrieved')

    // Check if intent already exists
    const checkSpinner = output.spinner('Checking for existing intents').start()
    const existingIntents = await queryDashboardStore<Intent>({
      apiClient,
      dashboardStoreId,
      query: `*[_type == "sanity.dashboard.intents" && id == "${intentDefinition.id}"]`,
    })
    checkSpinner.succeed()

    const existingIntent = existingIntents && existingIntents.length > 0 ? existingIntents[0] : null

    // Handle existing intent
    if (existingIntent && !flags.force) {
      output.print(`\nIntent with ID "${intentDefinition.id}" already exists:`)
      output.print(`  Title: ${existingIntent.title}`)
      output.print(`  Action: ${existingIntent.action}`)
      if (existingIntent.description) {
        output.print(`  Description: ${existingIntent.description}`)
      }

      const shouldUpdate = await prompt.single({
        type: 'confirm',
        message: 'Do you want to update the existing intent?',
        default: false,
      })

      if (!shouldUpdate) {
        output.print('Intent addition cancelled.')
        return
      }
    }

    // Create the intent document
    const createSpinner = output
      .spinner(existingIntent ? 'Updating intent' : 'Creating intent')
      .start()

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    // Get application ID from CLI config if available, otherwise use a default
    const applicationId =
      (cliConfig && 'app' in cliConfig && (cliConfig as CliConfig).app?.id) || 'cli-intents-app'

    const intentDocument = {
      _type: 'sanity.dashboard.intents',
      _version: 1,
      id: intentDefinition.id,
      action: intentDefinition.action,
      title: intentDefinition.title,
      description: intentDefinition.description,
      filters: intentDefinition.filters,
      applicationId: applicationId,
      organizationId: organizationId,
    }

    // Create the intent using the dashboard store API
    await client
      .withConfig({
        'apiVersion': 'vX',
        '~experimental_resource': {
          id: dashboardStoreId,
          type: 'dashboard',
        },
      })
      .transaction()
      .create(intentDocument)
      .commit({
        tag: 'intent-create',
      })

    createSpinner.succeed(
      existingIntent
        ? `Intent "${intentDefinition.title}" updated successfully!`
        : `Intent "${intentDefinition.title}" created successfully!`,
    )

    // Display summary
    output.print(`\nIntent Details:`)
    output.print(`  ID: ${intentDefinition.id}`)
    output.print(`  Title: ${intentDefinition.title}`)
    output.print(`  Action: ${intentDefinition.action}`)
    if (intentDefinition.description) {
      output.print(`  Description: ${intentDefinition.description}`)
    }
    output.print(`  Application ID: ${applicationId}`)
    output.print(`  Organization: ${organizationId}`)
    output.print(`  Filters: ${intentDefinition.filters.length} filter(s)`)
  } catch (error) {
    output.error(`Failed to add intent: ${error.message}`)
    throw error
  }
}
