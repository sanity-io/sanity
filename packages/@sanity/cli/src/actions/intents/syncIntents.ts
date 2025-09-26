import path from 'node:path'

import {getDashboardStoreId} from '../../commands/intents/utils/getDashboardStoreId'
import {type CliCommandDefinition} from '../../types'
import {pathExists} from '../../util/pathExists'
import {type IntentDefinition} from './types'
import {getIntentFiles} from './utils/getIntentFiles'
import {
  analyzeIntentConflicts,
  getApplicationId,
  getOrganizationId,
  processIntent,
  promptForIntentUpdate,
} from './utils/intentOperations'
import {loadIntentFile} from './utils/loadIntentFile'

export interface SyncIntentsFlags {
  force?: boolean
  organization?: string
}

export const syncIntents: CliCommandDefinition<SyncIntentsFlags>['action'] = async (
  args,
  context,
) => {
  const {output, apiClient} = context
  const targetDir = args.argsWithoutOptions[0] || '_intents'
  const flags = {...args.extOptions, organizationId: args.extOptions.organization}

  output.print(`Syncing intents from directory: ${targetDir}`)

  try {
    // Get organization and application IDs
    const organizationId = getOrganizationId(context, flags)
    const applicationId = getApplicationId(context)

    // Check if the directory exists
    const dirExists = await pathExists(targetDir)
    if (!dirExists) {
      throw new Error(`Directory does not exist: ${targetDir}`)
    }

    // Get all intent files from the directory
    const intentFiles = await getIntentFiles(targetDir)

    if (intentFiles.length === 0) {
      output.print('No intent files found in the directory.')
      return
    }

    output.print(`Found ${intentFiles.length} intent file(s):`)

    // Load each intent file and create objects in memory
    const intents: IntentDefinition[] = []
    const failedFiles: string[] = []

    for (const filePath of intentFiles) {
      try {
        output.print(`  Reading: ${path.relative(targetDir, filePath)}`)
        const intent = await loadIntentFile(filePath)
        intents.push(intent)
        output.print(`    ✓ Read intent: ${intent.title}`)
      } catch (error) {
        output.print(`    ✗ Failed to read ${filePath}: ${error.message}`)
        failedFiles.push(filePath)
      }
    }

    if (intents.length === 0) {
      output.print('No valid intent files found.')
      return
    }

    // Get dashboard store ID
    const dashboardSpinner = output.spinner('Getting dashboard store ID').start()
    const dashboardStoreId = await getDashboardStoreId({
      apiClient,
      organizationId,
    })
    dashboardSpinner.succeed('Dashboard store ID retrieved')

    // Analyze conflicts and new intents
    output.print('\nAnalyzing existing intents...')
    const {conflicts, newIntents} = await analyzeIntentConflicts(
      context,
      dashboardStoreId,
      intents,
      flags.force,
    )

    // Display analysis results
    output.print(`\nAnalysis Results:`)
    output.print(`  📁 Total files processed: ${intentFiles.length}`)
    if (failedFiles.length > 0) {
      output.print(`  ❌ Failed to read: ${failedFiles.length}`)
    }
    output.print(`  ✨ New intents: ${newIntents.length}`)
    output.print(`  🔄 Intents with changes: ${conflicts.length}`)

    // Handle conflicts
    const intentsToUpdate: IntentDefinition[] = []

    if (conflicts.length > 0 && !flags.force) {
      output.print(`\n🔄 The following intents have changes:`)

      for (const conflict of conflicts) {
        const {intentDefinition, existingIntent} = conflict
        output.print(`\n  Intent: ${intentDefinition.id}`)
        output.print(`    File: ${intentDefinition.title}`)
        output.print(`    Current: ${existingIntent.title}`)

        // Show differences
        if (existingIntent.action !== intentDefinition.action) {
          output.print(`    Action: ${existingIntent.action} → ${intentDefinition.action}`)
        }
        if (existingIntent.description !== intentDefinition.description) {
          output.print(
            `    Description changed: ${existingIntent.description ? 'Yes' : 'No'} → ${intentDefinition.description ? 'Yes' : 'No'}`,
          )
        }
      }

      // Prompt for bulk action
      const bulkAction = await context.prompt.single({
        type: 'list',
        message: `How would you like to handle the ${conflicts.length} conflicting intent(s)?`,
        choices: [
          {value: 'update-all', name: 'Update all conflicting intents'},
          {value: 'skip-all', name: 'Skip all conflicting intents'},
          {value: 'review-each', name: 'Review each conflict individually'},
          {value: 'cancel', name: 'Cancel sync operation'},
        ],
        default: 'review-each',
      })

      switch (bulkAction) {
        case 'update-all':
          intentsToUpdate.push(...conflicts.map((c) => c.intentDefinition))
          break
        case 'skip-all':
          // Do nothing, intentsToUpdate remains empty
          break
        case 'review-each':
          for (const conflict of conflicts) {
            const shouldUpdate = await promptForIntentUpdate(
              context,
              conflict.intentDefinition,
              conflict.existingIntent,
            )
            // eslint-disable-next-line max-depth -- can be refactored later
            if (shouldUpdate) {
              intentsToUpdate.push(conflict.intentDefinition)
            }
          }
          break
        case 'cancel':
          output.print('Sync operation cancelled.')
          return
        default:
          output.print('Invalid bulk action.')
          return
      }
    } else if (conflicts.length > 0 && flags.force) {
      // Force flag is set, update all conflicts
      intentsToUpdate.push(...conflicts.map((c) => c.intentDefinition))
    }

    // Process all intents
    const results = {
      created: 0,
      updated: 0,
      skipped: conflicts.length - intentsToUpdate.length,
      failed: 0,
    }

    output.print(`\n🚀 Processing intents...`)

    // Process new intents
    for (const intent of newIntents) {
      try {
        const result = await processIntent(
          context,
          dashboardStoreId,
          intent,
          organizationId,
          applicationId,
        )
        if (result === 'created') results.created++
      } catch (error) {
        output.error(`Failed to create intent ${intent.id}: ${error.message}`)
        results.failed++
      }
    }

    // Process intents to update
    for (const intent of intentsToUpdate) {
      try {
        const conflict = conflicts.find((c) => c.intentDefinition.id === intent.id)
        const result = await processIntent(
          context,
          dashboardStoreId,
          intent,
          organizationId,
          applicationId,
          conflict?.existingIntent,
        )
        if (result === 'updated') results.updated++
      } catch (error) {
        output.error(`Failed to update intent ${intent.id}: ${error.message}`)
        results.failed++
      }
    }

    // Display final summary
    output.print(`\n✅ Sync completed!`)
    output.print(`\nSummary:`)
    output.print(`  📁 Files processed: ${intentFiles.length}`)
    output.print(`  ✨ Intents created: ${results.created}`)
    output.print(`  🔄 Intents updated: ${results.updated}`)
    output.print(`  ⏭️  Intents skipped: ${results.skipped}`)
    if (results.failed > 0) {
      output.print(`  ❌ Failed operations: ${results.failed}`)
    }
    if (failedFiles.length > 0) {
      output.print(`  ❌ Failed file reads: ${failedFiles.length}`)
    }
    output.print(`  🏢 Organization: ${organizationId}`)
    output.print(`  📱 Application: ${applicationId}`)
  } catch (error) {
    output.error(`Error syncing intents: ${error.message}`)
    throw error
  }
}
