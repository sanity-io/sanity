import {type CliCommandGroupDefinition} from '../../types'

const intentsGroup: CliCommandGroupDefinition = {
  name: 'intents',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manage intents for your Sanity organization',
  // until the feature is ready
  hideFromHelp: true,
}

export default intentsGroup
