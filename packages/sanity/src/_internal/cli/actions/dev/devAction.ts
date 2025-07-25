/* eslint-disable max-statements */
import path from 'node:path'

import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliConfig,
  type CliOutputter,
} from '@sanity/cli'
import {type SanityProject} from '@sanity/client'
import chalk from 'chalk'
import {info} from 'log-symbols'
import semver from 'semver'
import {hideBin} from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {debug as debugIt} from '../../debug'
import {type DevServerOptions, startDevServer} from '../../server/devServer'
import {checkRequiredDependencies} from '../../util/checkRequiredDependencies'
import {checkStudioDependencyVersions} from '../../util/checkStudioDependencyVersions'
import {compareDependencyVersions} from '../../util/compareDependencyVersions'
import {getStudioAutoUpdateImportMap} from '../../util/getAutoUpdatesImportMap'
import {isInteractive} from '../../util/isInteractive'
import {getPackageManagerChoice} from '../../util/packageManager/packageManagerChoice'
import {upgradePackages} from '../../util/packageManager/upgradePackages'
import {getSharedServerConfig, gracefulServerDeath} from '../../util/servers'
import {shouldAutoUpdate} from '../../util/shouldAutoUpdate'
import {getTimer} from '../../util/timing'

export interface StartDevServerCommandFlags {
  'host'?: string
  'port'?: string
  'load-in-dashboard'?: boolean
  'auto-updates'?: boolean
  'force'?: boolean
}

const debug = debugIt.extend('dev')

const getDefaultCoreURL = ({
  organizationId,
  url,
}: {
  organizationId: string
  url: string
}): string => {
  const params = new URLSearchParams({
    url,
  })

  return process.env.SANITY_INTERNAL_ENV === 'staging'
    ? `https://sanity.work/@${organizationId}?${params.toString()}`
    : `https://sanity.io/@${organizationId}?${params.toString()}`
}

const getCoreApiURL = (): string => {
  return process.env.SANITY_INTERNAL_ENV === 'staging' ? 'https://sanity.work' : 'https://sanity.io'
}

export const getCoreURL = async ({
  fetchFn = globalThis.fetch,
  timeout = 5000,
  organizationId,
  url,
}: {
  fetchFn?: typeof globalThis.fetch
  timeout?: number
  organizationId: string
  url: string
}): Promise<string> => {
  const abortController = new AbortController()
  // Wait for 5 seconds before aborting the request
  const timer = setTimeout(() => abortController.abort(), timeout)
  try {
    const queryParams = new URLSearchParams({
      organizationId,
      url,
    })

    const res = await fetchFn(
      `${getCoreApiURL()}/api/dashboard/mode/development/resolve-url?${queryParams.toString()}`,
      {
        signal: abortController.signal,
      },
    )

    if (!res.ok) {
      debug(`Failed to fetch core URL: ${res.statusText}`)
      return getDefaultCoreURL({organizationId, url})
    }

    const body = await res.json()
    return body.url
  } catch (err) {
    debug(`Failed to fetch core URL: ${err.message}`)
    return getDefaultCoreURL({organizationId, url})
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Gets the core URL from API or uses the default core URL
 */
export const getCoreAppURL = async ({
  organizationId,
  httpHost = 'localhost',
  httpPort = 3333,
}: {
  organizationId: string
  httpHost?: string
  httpPort?: number
}): Promise<string> => {
  const url = await getCoreURL({
    organizationId,
    url: `http://${httpHost}:${httpPort}`,
  })

  // <core-app-url>/<orgniazationId>?dev=<dev-server-url>
  return url
}

function parseCliFlags(args: {argv?: string[]}) {
  // Using slice(1) to remove the first argument, which is the command `dev` path to the CLI
  return yargs(hideBin(args.argv || process.argv).slice(1))
    .options('host', {type: 'string'})
    .options('port', {type: 'number'})
    .options('auto-updates', {type: 'boolean'})
    .option('load-in-dashboard', {type: 'boolean', default: false}).argv
}

export default async function startSanityDevServer(
  args: CliCommandArguments<StartDevServerCommandFlags>,
  context: CliCommandContext,
): Promise<void> {
  const timers = getTimer()
  const flags = await parseCliFlags(args)
  const {output, apiClient, workDir, cliConfig, prompt, cliPackageManager} = context

  const {loadInDashboard} = flags

  timers.start('checkStudioDependencyVersions')
  await checkStudioDependencyVersions(workDir)
  timers.end('checkStudioDependencyVersions')

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  if ((await checkRequiredDependencies(context)).didInstall) {
    return
  }

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  const {didInstall, installedSanityVersion} = await checkRequiredDependencies(context)
  if (didInstall) {
    return
  }

  const autoUpdatesEnabled = shouldAutoUpdate({flags, cliConfig})

  // Get the version without any tags if any
  const coercedSanityVersion = semver.coerce(installedSanityVersion)?.version
  if (autoUpdatesEnabled && !coercedSanityVersion) {
    throw new Error(`Failed to parse installed Sanity version: ${installedSanityVersion}`)
  }
  const version = encodeURIComponent(`^${coercedSanityVersion}`)
  const autoUpdatesImports = getStudioAutoUpdateImportMap(version)

  if (autoUpdatesEnabled) {
    output.print(`${info} Running with auto-updates enabled`)
    // Check the versions
    const result = await compareDependencyVersions(autoUpdatesImports, workDir)
    const message =
      `The following local package versions are different from the versions currently served at runtime.\n` +
      `When using auto updates, we recommend that you run with the same versions locally as will be used when deploying. \n\n` +
      `${result.map((mod) => ` - ${mod.pkg} (local version: ${mod.installed}, runtime version: ${mod.remote})`).join('\n')} \n\n`

    // mismatch between local and auto-updating dependencies
    if (result?.length) {
      if (isInteractive) {
        const shouldUpgrade = await prompt.single({
          type: 'confirm',
          message: chalk.yellow(`${message}Do you want to upgrade local versions?`),
          default: true,
        })
        if (shouldUpgrade) {
          await upgradePackages(
            {
              packageManager: (await getPackageManagerChoice(workDir, {interactive: false})).chosen,
              packages: result.map((res) => [res.pkg, res.remote]),
            },
            context,
          )
        }
      } else {
        // In this case we warn the user but we don't ask them if they want to upgrade because it's not interactive.
        output.print(chalk.yellow(message))
      }
    }
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
      debug(`Failed to get organization Id from project Id: ${err}`)
      output.error('Failed to get organization Id from project Id')
      process.exit(1)
    }
  }

  try {
    const spinner = output.spinner('Starting dev server').start()
    await startDevServer({...config, spinner, skipStartLog: loadInDashboard})

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
            await getCoreAppURL({
              organizationId,
              httpHost: config.httpHost,
              httpPort: config.httpPort,
            }),
          ),
        ),
      )
    }
  } catch (err) {
    debug(`Failed to start dev server: ${err}`)
    gracefulServerDeath('dev', config.httpHost, config.httpPort, err)
  }
}

export function getDevServerConfig({
  flags,
  workDir,
  cliConfig,
  output,
}: {
  flags: {host?: string; port?: number}
  workDir: string
  cliConfig?: CliConfig
  output: CliOutputter
}): Omit<DevServerOptions, 'spinner'> {
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

  const env = process.env
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
