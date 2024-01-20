import boxen from 'boxen'
import chalk from 'chalk'

import {telemetryLearnMoreMessage} from '../commands/telemetry/telemetryStatusCommand'
import {debug} from '../debug'
import {getUserConfig} from './getUserConfig'
import {isCi} from './isCi'

const TELEMETRY_DISCLOSED_CONFIG_KEY = 'telemetryDisclosed'

export function telemetryDisclosure(): void {
  const userConfig = getUserConfig()

  if (isCi) {
    debug('CI environment detected, skipping telemetry disclosure')
    return
  }

  if (userConfig.get(TELEMETRY_DISCLOSED_CONFIG_KEY)) {
    debug('Telemetry disclosure has already been shown')
    return
  }

  // Print to stderr to prevent garbling command output
  console.error(
    boxen(
      `The Sanity CLI now collects telemetry data on general usage and errors.
This helps us improve Sanity and prioritize features.

To opt in/out, run ${chalk.cyan('npx sanity telemetry enable/disable')}.

${telemetryLearnMoreMessage('unset')}`,
      {
        padding: 1,
        margin: 1,
        borderColor: 'yellow',

        // Typescript issues forcing these to any
        borderStyle: 'round' as any,
      },
    ),
  )

  userConfig.set(TELEMETRY_DISCLOSED_CONFIG_KEY, Date.now())
}
