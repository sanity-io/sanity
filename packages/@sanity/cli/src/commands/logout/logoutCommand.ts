import chalk from 'chalk'

import {type CliCommandDefinition} from '../../types'
import {TELEMETRY_CONSENT_CONFIG_KEY} from '../../util/createTelemetryStore'
import {getUserConfig} from '../../util/getUserConfig'

const helpText = `
Examples
  # Log out of the CLI
  sanity logout
`

const logoutCommand: CliCommandDefinition = {
  name: 'logout',
  helpText,
  signature: 'logout',
  description: 'Logs out the CLI from the current user session',
  async action(args, {output, apiClient}) {
    const cfg = getUserConfig()

    const token = cfg.get('authToken')
    if (!token) {
      output.print(chalk.red('No login credentials found'))
      return
    }

    const client = apiClient({requireUser: true, requireProject: false})
    try {
      await client.request({uri: '/auth/logout', method: 'POST'})
    } catch (err) {
      const statusCode = err && err.response && err.response.statusCode

      // In the case of session timeouts or missing sessions, we'll get a 401
      // This is an acceptable situation seen from a logout perspective - all we
      // need to do in this case is clear the session from the view of the CLI
      if (statusCode !== 401) {
        output.error(chalk.red(`Failed to communicate with the Sanity API:\n${err.message}`))
        return
      }
    }

    cfg.delete('authType')
    cfg.delete('authToken')

    // Clear cached telemetry consent
    cfg.delete(TELEMETRY_CONSENT_CONFIG_KEY)

    output.success('Logged out')
  },
}

export default logoutCommand
