import type {CliCommandDefinition} from '../../types'

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
  action: async (_, {apiClient, output, chalk}) => {
    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    try {
      // TODO: Finalise API request.
      await client.request({
        method: 'PUT',
        uri: '/users/me/consents/telemetry/status/granted',
      })
    } catch (err) {
      err.message = 'Failed to enable telemetry'
      throw err
    }

    output.print(chalk.green('Telemetry enabled'))
  },
}

export default enableTelemetryCommand
