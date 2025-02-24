import {type CliCommandGroupDefinition} from '../../types'

const functionsGroup: CliCommandGroupDefinition = {
  name: 'functions',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Test Sanity Functions locally and retrieve logs',
}

export default functionsGroup
