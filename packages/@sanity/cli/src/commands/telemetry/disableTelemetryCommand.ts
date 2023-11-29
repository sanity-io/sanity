import type {CliCommandDefinition} from '../../types'

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
  action: async (_, {apiClient, output, chalk}) => {
    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    try {
      // TODO: Finalise API request.
      await client.request({
        method: 'PUT',
        uri: '/users/me/consents/telemetry/status/denied',
      })
    } catch (err) {
      err.message = 'Failed to disable telemetry'
      throw err
    }

    output.print(chalk.green('Telemetry disabled'))
  },
}

export default disableTelemetryCommand
