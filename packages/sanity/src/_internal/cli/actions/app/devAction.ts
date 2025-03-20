import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import chalk from 'chalk'
import {hideBin} from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {startDevServer} from '../../server/devServer'
import {gracefulServerDeath} from '../../util/servers'
import {getCoreAppURL, getDevServerConfig, type StartDevServerCommandFlags} from '../dev/devAction'

function parseCliFlags(args: {argv?: string[]}) {
  // Using slice(1) to remove the first argument, which is the command `dev` path to the CLI
  return yargs(hideBin(args.argv || process.argv).slice(1))
    .options('host', {type: 'string'})
    .options('port', {type: 'number'})
    .options('load-in-dashboard', {type: 'boolean', default: true}).argv
}

export default async function startAppDevServer(
  args: CliCommandArguments<StartDevServerCommandFlags>,
  context: CliCommandContext,
): Promise<void> {
  const flags = await parseCliFlags(args)
  const {output, workDir, cliConfig} = context

  if (!flags.loadInDashboard) {
    output.warn(`Apps cannot run without the Sanity dashboard`)
    output.warn(`Starting dev server with the --load-in-dashboard flag set to true`)
  }

  let organizationId: string | undefined
  if (
    cliConfig &&
    '__experimental_appConfiguration' in cliConfig &&
    cliConfig.__experimental_appConfiguration?.organizationId
  ) {
    organizationId = cliConfig.__experimental_appConfiguration.organizationId
  }

  if (!organizationId) {
    output.error(`Apps require an organization ID (orgId) specified in your sanity.cli.ts file`)
    process.exit(1)
  }

  // Try to load CLI configuration from sanity.cli.(js|ts)
  const config = getDevServerConfig({
    flags,
    workDir,
    cliConfig,
    output,
  })

  try {
    const spinner = output.spinner('Starting dev server').start()
    await startDevServer({...config, skipStartLog: true, isApp: true})
    spinner.succeed()

    output.print(`Dev server started on port ${config.httpPort}`)
    output.print(`View your app in the Sanity dashboard here:`)
    output.print(
      chalk.blue(
        chalk.underline(
          getCoreAppURL({organizationId, httpHost: config.httpHost, httpPort: config.httpPort}),
        ),
      ),
    )
  } catch (err) {
    gracefulServerDeath('dev', config.httpHost, config.httpPort, err)
  }
}
