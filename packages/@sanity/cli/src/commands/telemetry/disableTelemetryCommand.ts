import type {CliCommandDefinition} from '../../types'
import {setTelemetryConsent} from '../../actions/telemetry/setTelemetryConsent'

const helpText = `
Examples
  # Disable telemetry for your logged in user
  sanity telemetry disable
`

const disableTelemetryCommand: CliCommandDefinition = {
  name: 'disable',
  group: 'telemetry',
  helpText,
  signature: '',
  description: 'Disable telemetry for your logged in user',
  action: (_, context) => setTelemetryConsent('denied', context),
}

export default disableTelemetryCommand
