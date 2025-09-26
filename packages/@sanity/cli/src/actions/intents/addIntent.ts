import {getDashboardStoreId} from '../../commands/intents/utils/getDashboardStoreId'
import {type CliCommandDefinition} from '../../types'
import {
  checkExistingIntent,
  getApplicationId,
  getOrganizationId,
  processIntent,
  promptForIntentUpdate,
} from './utils/intentOperations'
import {loadIntentFile} from './utils/loadIntentFile'

export interface AddIntentFlags {
  force?: boolean
  organization?: string
}

export const addIntent: CliCommandDefinition<AddIntentFlags>['action'] = async (args, context) => {
  const {output, apiClient} = context
  const [filePath] = args.argsWithoutOptions
  const flags = {...args.extOptions, organizationId: args.extOptions.organization}

  if (!filePath) {
    throw new Error('File path is required')
  }

  output.print(`Adding intent from file: ${filePath}`)

  try {
    // Get organization and application IDs
    const organizationId = getOrganizationId(context, flags)
    const applicationId = getApplicationId(context)

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
    output.print('Checking for existing intents')
    const existingIntent = await checkExistingIntent(context, dashboardStoreId, intentDefinition.id)

    // Handle existing intent
    if (existingIntent && !flags.force) {
      const shouldUpdate = await promptForIntentUpdate(context, intentDefinition, existingIntent)

      if (!shouldUpdate) {
        output.print('Intent addition cancelled.')
        return
      }
    }

    // Process the intent
    const result = await processIntent(
      context,
      dashboardStoreId,
      intentDefinition,
      organizationId,
      applicationId,
      existingIntent,
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
    output.print(`  Status: ${result}`)
  } catch (error) {
    output.error(`Failed to add intent: ${error.message}`)
    throw error
  }
}
