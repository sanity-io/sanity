import {type ConsentStatus} from '@sanity/telemetry'

import {type CliCommandContext, type CliCommandDefinition} from '../../types'
import {resolveConsent} from '../../util/createTelemetryStore'

const helpText = `
Examples
  # Check telemetry consent status for your logged in user
  sanity telemetry status
`

export function telemetryStatusMessage(status: ConsentStatus, {chalk}: CliCommandContext): string {
  switch (status) {
    case 'granted':
      return `Status: ${chalk.green('Enabled')}`
    case 'denied':
      return `Status: ${chalk.red('Disabled')}`
    case 'unset':
      return `Status: ${chalk.yellow('Not set')}`
    default:
      return ''
  }
}

export function telemetryLearnMoreMessage(status: ConsentStatus): string {
  const url = 'https://www.sanity.io/telemetry'

  switch (status) {
    case 'granted':
      return `Learn more about the data being collected here:\n${url}`
    default:
      return `Learn more here:\n${url}`
  }
}

const telemetryStatusCommand: CliCommandDefinition = {
  name: 'status',
  group: 'telemetry',
  helpText,
  signature: '',
  description: 'Check telemetry consent status for your logged in user',
  action: async (_, context) => {
    const {chalk, output} = context
    // eslint-disable-next-line no-process-env
    const {status, reason} = await resolveConsent({env: process.env})

    switch (true) {
      case status === 'undetermined' && reason === 'unauthenticated':
        output.print('You need to log in first to see telemetry status.')
        break
      case status === 'undetermined' && reason === 'fetchError':
        output.print(chalk.yellow('Could not fetch telemetry consent status.'))
        break
      case status === 'denied' && reason === 'localOverride':
        output.print(`${telemetryStatusMessage(status, context)}\n`)
        output.print(
          `You've opted out of telemetry data collection.\nNo data will be collected from your machine.\n`,
        )
        output.print(`Using ${chalk.cyan('DO_NOT_TRACK')} environment variable.`)
        break
      case status === 'denied':
        output.print(`${telemetryStatusMessage(status, context)}\n`)
        output.print(
          `You've opted out of telemetry data collection.\nNo data will be collected from your Sanity account.`,
        )
        break
      case status === 'granted':
        output.print(`${telemetryStatusMessage(status, context)}\n`)
        output.print(
          'Telemetry data on general usage and errors is collected to help us improve Sanity.',
        )
        break
      case status === 'unset':
        output.print(`${telemetryStatusMessage(status, context)}\n`)
        output.print(`You've not set your preference for telemetry collection.\n`)
        output.print(`Run ${chalk.cyan('npx sanity telemetry enable/disable')} to opt in or out.`)
        output.print(
          `You can also use the ${chalk.cyan('DO_NOT_TRACK')} environment variable to opt out.`,
        )
        break
      default:
        break
    }

    output.print(`\n${telemetryLearnMoreMessage(status)}`)
  },
}

export default telemetryStatusCommand
