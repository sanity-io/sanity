import type {CliCommandDefinition} from '../../types'
import {resolveConsent} from '../../util/initTelemetry'
import {getCliToken} from '../../util/clientWrapper'

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
    const {status} = await resolveConsent({env: process.env})
    const token = getCliToken()

    if (status === 'undetermined' && !token) {
      output.print('You are not logged in.')
      return
    }

    switch (status) {
      case 'undetermined':
        output.print(chalk.yellow('Could not fetch telemetry consent status.'))
        break
      case 'denied':
        output.print(`Telemetry consent is ${chalk.red('denied')}.`)
        break
      case 'granted':
        output.print(`Telemetry consent is ${chalk.green('granted')}.`)
        break
      case 'unset':
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
