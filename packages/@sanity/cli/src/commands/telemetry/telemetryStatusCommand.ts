import type {CliCommandDefinition} from '../../types'
import {resolveConsent} from '../../util/createTelemetryStore'

const helpText = `
Examples
  # Check telemetry consent status for your logged in user
  sanity telemetry status
`

const telemetryStatusCommand: CliCommandDefinition = {
  name: 'status',
  group: 'telemetry',
  helpText,
  signature: '',
  description: 'Check telemetry consent status for your logged in user',
  action: async (_, {chalk, output}) => {
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
        output.print(`Telemetry consent is ${chalk.red('denied')}.`)
        output.print(`Using ${chalk.cyan('DO_NOT_TRACK')} environment variable.`)
        break
      case status === 'denied':
        output.print(`Telemetry consent is ${chalk.red('denied')}.`)
        break
      case status === 'granted':
        output.print(`Telemetry consent is ${chalk.green('granted')}.`)
        break
      case status === 'unset':
        output.print('You have not set telemetry consent.\n')
        output.print(
          `Run ${chalk.cyan('sanity telemetry enable')} or ${chalk.cyan(
            'sanity telemetry disable',
          )} to control telemetry collection.`,
        )
        output.print(
          `You can alternatively use the ${chalk.cyan('DO_NOT_TRACK')} environment variable.`,
        )
        break
      default:
        break
    }

    output.print('\nLearn more: https://sanity.io/telemetry')
  },
}

export default telemetryStatusCommand
