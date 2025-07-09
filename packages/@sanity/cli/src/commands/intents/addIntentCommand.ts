import {addIntent, type AddIntentFlags} from '../../actions/intents/addIntent'
import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  # Add intent from a file
  sanity intents add ./path/to/intent.ts

  # Add intent with force flag (overwrite existing)
  sanity intents add ./path/to/intent.ts --force
`

const addIntentCommand: CliCommandDefinition<AddIntentFlags> = {
  name: 'add',
  group: 'intents',
  helpText,
  signature: '[file-path] [--force] [-f]',
  description: 'Add an intent from a file that will be handled by this application',
  action: addIntent,
}

export default addIntentCommand
