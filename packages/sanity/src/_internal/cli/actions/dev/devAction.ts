import path from 'node:path'

import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliConfig,
  type CliOutputter,
} from '@sanity/cli'
import {type SanityProject} from '@sanity/client'
import chalk from 'chalk'
import {hideBin} from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {type DevServerOptions, startDevServer} from '../../server/devServer'
import {checkRequiredDependencies} from '../../util/checkRequiredDependencies'
import {checkStudioDependencyVersions} from '../../util/checkStudioDependencyVersions'
import {getSharedServerConfig, gracefulServerDeath} from '../../util/servers'
import {getTimer} from '../../util/timing'

export interface StartDevServerCommandFlags {
  'host'?: string
  'port'?: string
  'load-in-dashboard'?: boolean
  'force'?: boolean
}

export const getCoreURL = (): string => {
  return process.env.SANITY_INTERNAL_ENV === 'staging'
    ? 'https://core.sanity.work'
    : 'https://core.sanity.io'
}

export const getCoreAppURL = ({
  organizationId,
  httpHost = 'localhost',
  httpPort = 3333,
}: {
  organizationId: string
  httpHost?: string
  httpPort?: number
}): string => {
  // <core-app-url>/<orgniazationId>?dev=<dev-server-url>
  return `${getCoreURL()}/@${organizationId}?dev=http://${httpHost}:${httpPort}`
}

function parseCliFlags(args: {argv?: string[]}) {
  // Using slice(1) to remove the first argument, which is the command `dev` path to the CLI
  return yargs(hideBin(args.argv || process.argv).slice(1))
    .options('host', {type: 'string'})
    .options('port', {type: 'number'})
    .option('load-in-dashboard', {type: 'boolean', default: false}).argv
}

export default async function startSanityDevServer(
  args: CliCommandArguments<StartDevServerCommandFlags>,
  context: CliCommandContext,
): Promise<void> {
  const timers = getTimer()
  const flags = await parseCliFlags(args)
  const {output, apiClient, workDir, cliConfig} = context

  const {loadInDashboard} = flags

  timers.start('checkStudioDependencyVersions')
  checkStudioDependencyVersions(workDir)
  timers.end('checkStudioDependencyVersions')

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  if ((await checkRequiredDependencies(context)).didInstall) {
    return
  }

  // Try to load CLI configuration from sanity.cli.(js|ts)
  const config = getDevServerConfig({flags, workDir, cliConfig, output})

  const projectId = cliConfig?.api?.projectId
  let organizationId: string | undefined | null

  if (loadInDashboard) {
    if (!projectId) {
      output.error('Project Id is required to load in dashboard')
      process.exit(1)
    }

    const client = apiClient({
      requireUser: true,
      requireProject: true,
    })

    try {
      const project = await client.request<SanityProject>({uri: `/projects/${projectId}`})
      organizationId = project.organizationId
    } catch (err) {
      output.error('Failed to get organization Id from project Id')
      process.exit(1)
    }
  }

  try {
    const spinner = output.spinner('Starting dev server').start()
    await startDevServer({...config, skipStartLog: loadInDashboard})
    spinner.succeed()

    if (loadInDashboard) {
      if (!organizationId) {
        output.error('Organization Id not found for project')
        process.exit(1)
      }

      output.print(`Dev server started on ${config.httpPort} port`)
      output.print(`View your app in the Sanity dashboard here:`)
      output.print(
        chalk.blue(
          chalk.underline(
            getCoreAppURL({
              organizationId,
              httpHost: config.httpHost,
              httpPort: config.httpPort,
            }),
          ),
        ),
      )
    }
  } catch (err) {
    gracefulServerDeath('dev', config.httpHost, config.httpPort, err)
  }
}

export function getDevServerConfig({
  flags,
  workDir,
  cliConfig,
  output,
}: {
  flags: Awaited<ReturnType<typeof parseCliFlags>>
  workDir: string
  cliConfig?: CliConfig
  output: CliOutputter
}): DevServerOptions {
  const configSpinner = output.spinner('Checking configuration files...')
  const baseConfig = getSharedServerConfig({
    flags: {
      host: flags.host,
      port: flags.port,
    },
    workDir,
    cliConfig,
  })
  configSpinner.succeed()

  const env = process.env // eslint-disable-line no-process-env
  const reactStrictMode = env.SANITY_STUDIO_REACT_STRICT_MODE
    ? env.SANITY_STUDIO_REACT_STRICT_MODE === 'true'
    : Boolean(cliConfig?.reactStrictMode)

  if (env.SANITY_STUDIO_BASEPATH && cliConfig?.project?.basePath) {
    output.warn(
      `Overriding configured base path (${cliConfig.project.basePath}) with value from environment variable (${env.SANITY_STUDIO_BASEPATH})`,
    )
  }

  return {
    ...baseConfig,
    staticPath: path.join(workDir, 'static'),
    reactStrictMode,
    reactCompiler: cliConfig && 'reactCompiler' in cliConfig ? cliConfig.reactCompiler : undefined,
  }
}
