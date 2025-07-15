import path from 'node:path'

import {type CliCommandDefinition} from '../../types'
import {pathExists} from '../../util/pathExists'
import {IntentDefinition} from './types'
import {loadIntentFile} from './utils/loadIntentFile'
import {getIntentFiles} from './utils/getIntentFiles'

export const syncIntents: CliCommandDefinition['action'] = async (args, context) => {
  const {output} = context
  const targetDir = args.argsWithoutOptions[0] || '_intents'

  output.print(`Syncing intents from directory: ${targetDir}`)

  try {
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

    for (const filePath of intentFiles) {
      try {
        output.print(`  Reading: ${path.relative(targetDir, filePath)}`)
        const intent = await loadIntentFile(filePath)
        intents.push(intent)
        output.print(`    ✓ Read intent: ${intent.title}`)
      } catch (error) {
        output.print(`    ✗ Failed to read ${filePath}: ${error.message}`)
      }
    }

    // Display summary of loaded intents
    output.print(`\nSuccessfully loaded ${intents.length} intent(s):`)
    intents.forEach((intent, index) => {
      output.print(`  ${index + 1}. ${intent.title} (${intent.action})`)
      if (intent.description) {
        output.print(`     Description: ${intent.description}`)
      }
      if (intent.filters && intent.filters.length > 0) {
        output.print(`     Filters: ${intent.filters.length} filter(s)`)
      }
    })

    output.print('\nSync completed!')

    // TODO: Here you would implement the actual sync logic
    // For example, sending the intents to an API, storing them in a database, etc.
  } catch (error) {
    output.print(`Error syncing intents: ${error.message}`)
    throw error
  }
}
