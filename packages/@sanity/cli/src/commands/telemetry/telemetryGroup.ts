import {type CliCommandGroupDefinition} from '../../types'

const telemetryGroup: CliCommandGroupDefinition = {
  name: 'telemetry',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manages telemetry settings, opting in or out of data collection',
}

export default telemetryGroup
