import {destroyIntent, type DestroyIntentFlags} from '../../actions/intents/destroyIntent'
import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  # Remove a deployed intent from the organization
  sanity intents destroy intentName

  # Remove a deployed intent with force flag (skip confirmation)
  sanity intents destroy intentName --force
`

const destroyIntentCommand: CliCommandDefinition<DestroyIntentFlags> = {
  name: 'destroy',
  group: 'intents',
  helpText,
  signature: '[intent-name] [--force] [-f]',
  description: 'Remove a deployed intent from the organization',
  action: destroyIntent,
}

export default destroyIntentCommand
