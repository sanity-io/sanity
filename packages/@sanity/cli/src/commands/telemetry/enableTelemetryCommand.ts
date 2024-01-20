import {createSetTelemetryConsentAction} from '../../actions/telemetry/setTelemetryConsent'
import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  # Enable telemetry for your logged in user
  sanity telemetry enable
`

const enableTelemetryCommand: CliCommandDefinition = {
  name: 'enable',
  group: 'telemetry',
  helpText,
  signature: '',
  description: 'Enable telemetry for your logged in user',
  action: createSetTelemetryConsentAction('granted'),
}

export default enableTelemetryCommand
