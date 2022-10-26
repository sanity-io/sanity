import path from 'path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore The `@sanity/server` may not be built yet.
import {DevServerOptions, startDevServer} from '@sanity/server'
import type {CliConfig, CliCommandArguments, CliCommandContext} from '@sanity/cli'
import {getTimer} from '../../util/timing'
import {checkStudioDependencyVersions} from '../../util/checkStudioDependencyVersions'
import {checkRequiredDependencies} from '../../util/checkRequiredDependencies'
import {getSharedServerConfig, gracefulServerDeath} from '../../util/servers'

export interface StartDevServerCommandFlags {
  host?: string
  port?: string
}

export default async function startSanityDevServer(
  args: CliCommandArguments<StartDevServerCommandFlags>,
  context: CliCommandContext
): Promise<void> {
  const timers = getTimer()
  const flags = args.extOptions
  const {output, workDir, cliConfig} = context

  timers.start('checkStudioDependencyVersions')
  checkStudioDependencyVersions(workDir)
  timers.end('checkStudioDependencyVersions')

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  if ((await checkRequiredDependencies(context)).didInstall) {
    return
  }

  // Try to load CLI configuration from sanity.cli.(js|ts)
  const configSpinner = output.spinner('Checking configuration files...')
  const config = getDevServerConfig({flags, workDir, cliConfig})
  configSpinner.succeed()

  try {
    await startDevServer(config)
  } catch (err) {
    gracefulServerDeath('dev', config.httpHost, config.httpPort, err)
  }
}

function getDevServerConfig({
  flags,
  workDir,
  cliConfig,
}: {
  flags: StartDevServerCommandFlags
  workDir: string
  cliConfig?: CliConfig
}): DevServerOptions {
  const baseConfig = getSharedServerConfig({flags, workDir, cliConfig})
  const env = process.env // eslint-disable-line no-process-env
  const reactStrictMode = env.SANITY_STUDIO_REACT_STRICT_MODE
    ? env.SANITY_STUDIO_REACT_STRICT_MODE === 'true'
    : Boolean(cliConfig?.reactStrictMode)

  return {
    ...baseConfig,
    staticPath: path.join(workDir, 'static'),
    reactStrictMode,
  }
}
