import {type CliCommandGroupDefinition} from '../../types'

const intentsGroup: CliCommandGroupDefinition = {
  name: 'intents',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manage and work with intents for your Sanity organization',
  hideFromHelp: true,
}

export default intentsGroup
