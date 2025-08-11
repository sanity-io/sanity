import {syncIntents, type SyncIntentsFlags} from '../../actions/intents/syncIntents'
import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  # Sync intents from current directory
  sanity intents sync

  # Sync intents from specific directory
  sanity intents sync /path/to/intents

  # Force update all conflicting intents without prompting
  sanity intents sync /path/to/intents --force

  # Sync intents for a specific organization
  sanity intents sync /path/to/intents --organization <org-id>
`

const syncIntentsCommand: CliCommandDefinition<SyncIntentsFlags> = {
  name: 'sync',
  group: 'intents',
  helpText,
  signature: '[dir] [--force] [-f] [--organization <id>]',
  description: 'Update or create intents from a directory that will be handled by this application',
  action: syncIntents,
}

export default syncIntentsCommand
