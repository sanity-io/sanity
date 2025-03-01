import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'

import {startDevServer} from '../../server/devServer'
import {gracefulServerDeath} from '../../util/servers'
import {getDevServerConfig, type StartDevServerCommandFlags} from '../dev/devAction'

export default async function startAppDevServer(
  args: CliCommandArguments<StartDevServerCommandFlags>,
  context: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const {output, workDir, cliConfig} = context

  // Try to load CLI configuration from sanity.cli.(js|ts)
  const config = getDevServerConfig({
    flags: {
      ...flags,
      port: flags.port || '3334',
    },
    workDir,
    cliConfig,
    output,
  })

  try {
    await startDevServer(config)
  } catch (err) {
    gracefulServerDeath('dev', config.httpHost, config.httpPort, err)
  }
}
