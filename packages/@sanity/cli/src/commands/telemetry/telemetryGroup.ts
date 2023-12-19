import type {CliCommandGroupDefinition} from '../../types'

const telemetryGroup: CliCommandGroupDefinition = {
  name: 'telemetry',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Interact with telemetry settings for your logged in user',
}

export default telemetryGroup
