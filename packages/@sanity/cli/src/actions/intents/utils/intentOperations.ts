import {type Intent} from '../../../commands/intents/types'
import {queryDashboardStore} from '../../../commands/intents/utils/queryDashboardStore'
import {type CliCommandContext, type CliConfig} from '../../../types'
import {type IntentDefinition} from '../types'

export interface IntentOperationOptions {
  organizationId?: string
  force?: boolean
}

export interface IntentConflict {
  intentDefinition: IntentDefinition
  existingIntent: Intent
  action: 'create' | 'update'
}

/**
 * Get organization ID from CLI config or command line flags
 */
export function getOrganizationId(
  context: CliCommandContext,
  flags: IntentOperationOptions,
): string {
  const {cliConfig} = context

  const configOrganizationId =
    cliConfig && 'app' in cliConfig ? (cliConfig as CliConfig).app?.organizationId : undefined

  const organizationId = flags.organizationId ?? configOrganizationId

  if (!organizationId) {
    throw new Error(
      'Organization ID is required. Provide it via an --organization flag or set it in your sanity.cli.ts config file under the app.organizationId property.',
    )
  }

  return organizationId
}

/**
 * Create an intent document ready for upload to dashboard store
 */
export function createIntentDocument(
  intentDefinition: IntentDefinition,
  organizationId: string,
  applicationId: string,
) {
  return {
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
}

/**
 * Get application ID from CLI config or use default
 */
export function getApplicationId(context: CliCommandContext): string {
  const {cliConfig} = context

  return (cliConfig && 'app' in cliConfig && (cliConfig as CliConfig).app?.id) || 'cli-intents-app'
}

/**
 * Check if an intent already exists in the dashboard store
 */
export async function checkExistingIntent(
  context: CliCommandContext,
  dashboardStoreId: string,
  intentId: string,
): Promise<Intent | null> {
  const {apiClient} = context

  const existingIntents = await queryDashboardStore<Intent>({
    apiClient,
    dashboardStoreId,
    query: `*[_type == "sanity.dashboard.intents" && id == "${intentId}"]`,
  })

  return existingIntents && existingIntents.length > 0 ? existingIntents[0] : null
}

/**
 * Upload an intent to the dashboard store
 */
export async function uploadIntent(
  context: CliCommandContext,
  dashboardStoreId: string,
  intentDocument: any,
): Promise<void> {
  const {apiClient} = context

  const client = apiClient({
    requireUser: true,
    requireProject: false,
  })

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
}

/**
 * Prompt user for intent update confirmation
 */
export async function promptForIntentUpdate(
  context: CliCommandContext,
  intentDefinition: IntentDefinition,
  existingIntent: Intent,
): Promise<boolean> {
  const {output, prompt} = context

  output.print(`\nIntent with ID "${intentDefinition.id}" already exists:`)
  output.print(`  Current Title: ${existingIntent.title}`)
  output.print(`  New Title: ${intentDefinition.title}`)
  output.print(`  Current Action: ${existingIntent.action}`)
  output.print(`  New Action: ${intentDefinition.action}`)

  if (existingIntent.description !== intentDefinition.description) {
    output.print(`  Current Description: ${existingIntent.description || 'None'}`)
    output.print(`  New Description: ${intentDefinition.description || 'None'}`)
  }

  return await prompt.single({
    type: 'confirm',
    message: 'Do you want to update this intent?',
    default: false,
  })
}

/**
 * Analyze differences between local intents and existing intents
 */
export async function analyzeIntentConflicts(
  context: CliCommandContext,
  dashboardStoreId: string,
  intentDefinitions: IntentDefinition[],
  force: boolean = false,
): Promise<{
  conflicts: IntentConflict[]
  newIntents: IntentDefinition[]
}> {
  const conflicts: IntentConflict[] = []
  const newIntents: IntentDefinition[] = []

  for (const intentDefinition of intentDefinitions) {
    const existingIntent = await checkExistingIntent(context, dashboardStoreId, intentDefinition.id)

    if (existingIntent) {
      // Check if there are actual differences
      const hasChanges =
        existingIntent.title !== intentDefinition.title ||
        existingIntent.action !== intentDefinition.action ||
        existingIntent.description !== intentDefinition.description ||
        JSON.stringify(existingIntent.filters) !== JSON.stringify(intentDefinition.filters)

      if (hasChanges) {
        conflicts.push({
          intentDefinition,
          existingIntent,
          action: 'update',
        })
      }
    } else {
      newIntents.push(intentDefinition)
    }
  }

  return {conflicts, newIntents}
}

/**
 * Process a single intent (create or update)
 *
 */
// eslint-disable-next-line max-params -- can be refactored later
export async function processIntent(
  context: CliCommandContext,
  dashboardStoreId: string,
  intentDefinition: IntentDefinition,
  organizationId: string,
  applicationId: string,
  existingIntent?: Intent | null,
): Promise<'created' | 'updated' | 'skipped'> {
  const {output} = context

  const spinner = output
    .spinner(existingIntent ? `Updating ${intentDefinition.id}` : `Creating ${intentDefinition.id}`)
    .start()

  try {
    const intentDocument = createIntentDocument(intentDefinition, organizationId, applicationId)

    await uploadIntent(context, dashboardStoreId, intentDocument)

    spinner.succeed(
      existingIntent
        ? `Updated intent: ${intentDefinition.title}`
        : `Created intent: ${intentDefinition.title}`,
    )

    return existingIntent ? 'updated' : 'created'
  } catch (error) {
    spinner.fail(
      `Failed to ${existingIntent ? 'update' : 'create'} intent: ${intentDefinition.title}`,
    )
    throw error
  }
}
