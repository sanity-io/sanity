import {type CliCommandGroupDefinition} from '../../types'

const functionsGroup: CliCommandGroupDefinition = {
  name: 'functions',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manage, test, and observe Sanity Functions',
}

export default functionsGroup
