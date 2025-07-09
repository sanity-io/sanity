import {syncIntents} from '../../actions/intents/syncIntents'
import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  # Sync intents from current directory
  sanity intents sync

  # Sync intents from specific directory
  sanity intents sync /path/to/intents
`

const syncIntentsCommand: CliCommandDefinition = {
  name: 'sync',
  group: 'intents',
  helpText,
  signature: '[dir] [--force] [-f]',
  description: 'Update or create intents from a directory that will be handled by this application',
  action: syncIntents,
}

export default syncIntentsCommand
