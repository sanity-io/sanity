/* eslint-disable max-statements */
import path from 'node:path'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {noopLogger} from '@sanity/telemetry'
import chalk from 'chalk'
import {info} from 'log-symbols'
import {rimraf} from 'rimraf'
import semver from 'semver'

import {buildStaticFiles} from '../../server'
import {buildVendorDependencies} from '../../server/buildVendorDependencies'
import {compareDependencyVersions} from '../../util/compareDependencyVersions'
import {getAppAutoUpdateImportMap} from '../../util/getAutoUpdatesImportMap'
import {formatModuleSizes, sortModulesBySize} from '../../util/moduleFormatUtils'
import {readModuleVersion} from '../../util/readModuleVersion'
import {shouldAutoUpdate} from '../../util/shouldAutoUpdate'
import {getTimer} from '../../util/timing'
import {BuildTrace} from './build.telemetry'

export interface BuildSanityAppCommandFlags {
  'yes'?: boolean
  'y'?: boolean
  'minify'?: boolean
  'stats'?: boolean
  'source-maps'?: boolean
  'auto-updates'?: boolean
}

export default async function buildSanityApp(
  args: CliCommandArguments<BuildSanityAppCommandFlags>,
  context: CliCommandContext,
  overrides?: {basePath?: string},
): Promise<{didCompile: boolean}> {
  const timer = getTimer()
  const {output, prompt, workDir, cliConfig, telemetry = noopLogger} = context
  const flags: BuildSanityAppCommandFlags = {
    'minify': true,
    'stats': false,
    'source-maps': false,
    ...args.extOptions,
  }

  /**
   * Unattended mode means that if there are any prompts it will use `YES` for them but will no change anything that doesn't have a prompt
   */
  const unattendedMode = Boolean(flags.yes || flags.y)
  const defaultOutputDir = path.resolve(path.join(workDir, 'dist'))
  const outputDir = path.resolve(args.argsWithoutOptions[0] || defaultOutputDir)

  const autoUpdatesEnabled = shouldAutoUpdate({flags, cliConfig})

  const installedSdkVersion = await readModuleVersion(context.workDir, '@sanity/sdk-react')
  const installedSanityVersion = await readModuleVersion(context.workDir, 'sanity')

  if (!installedSdkVersion) {
    throw new Error(`Failed to find installed @sanity/sdk-react version`)
  }
  // Get the version without any tags if any
  const coercedSdkVersion = semver.coerce(installedSdkVersion)?.version
  // Sanity might not be installed, but if it is we want to auto update it.
  const coercedSanityVersion = semver.coerce(installedSanityVersion)?.version
  if (autoUpdatesEnabled && !coercedSdkVersion) {
    throw new Error(`Failed to parse installed SDK version: ${installedSdkVersion}`)
  }
  const sdkVersion = encodeURIComponent(`^${coercedSdkVersion}`)
  const sanityVersion = coercedSanityVersion && encodeURIComponent(`^${coercedSanityVersion}`)
  const autoUpdatesImports = getAppAutoUpdateImportMap({sdkVersion, sanityVersion})

  if (autoUpdatesEnabled) {
    output.print(`${info} Building with auto-updates enabled`)

    // Check the versions
    const result = await compareDependencyVersions(autoUpdatesImports, workDir)

    // If it is in unattended mode, we don't want to prompt
    if (result?.length && !unattendedMode) {
      const shouldContinue = await prompt.single({
        type: 'confirm',
        message: chalk.yellow(
          `The following local package versions are different from the versions currently served at runtime.\n` +
            `When using auto updates, we recommend that you test locally with the same versions before deploying. \n\n` +
            `${result.map((mod) => ` - ${mod.pkg} (local version: ${mod.installed}, runtime version: ${mod.remote})`).join('\n')} \n\n` +
            `Continue anyway?`,
        ),
        default: false,
      })

      if (!shouldContinue) {
        return process.exit(0)
      }
    }
  }

  const envVarKeys = getSanityEnvVars()
  if (envVarKeys.length > 0) {
    output.print(
      '\nIncluding the following environment variables as part of the JavaScript bundle:',
    )
    envVarKeys.forEach((key) => output.print(`- ${key}`))
    output.print('')
  }

  let shouldClean = true
  if (outputDir !== defaultOutputDir && !unattendedMode) {
    shouldClean = await prompt.single({
      type: 'confirm',
      message: `Do you want to delete the existing directory (${outputDir}) first?`,
      default: true,
    })
  }

  // Determine base path for built studio
  let basePath = '/'
  const envBasePath = process.env.SANITY_APP_BASEPATH
  const configBasePath = cliConfig?.project?.basePath

  // Allow `sanity deploy` to override base path
  if (overrides?.basePath) {
    basePath = overrides.basePath
  } else if (envBasePath) {
    // Environment variable (SANITY_APP_BASEPATH)
    basePath = envBasePath
  } else if (configBasePath) {
    // `sanity.cli.ts`
    basePath = configBasePath
  }

  if (envBasePath && configBasePath) {
    output.warn(
      `Overriding configured base path (${configBasePath}) with value from environment variable (${envBasePath})`,
    )
  }

  let spin

  if (shouldClean) {
    timer.start('cleanOutputFolder')
    spin = output.spinner('Clean output folder').start()
    await rimraf(outputDir)
    const cleanDuration = timer.end('cleanOutputFolder')
    spin.text = `Clean output folder (${cleanDuration.toFixed()}ms)`
    spin.succeed()
  }

  spin = output.spinner(`Build Sanity application`).start()

  const trace = telemetry.trace(BuildTrace)
  trace.start()

  let importMap

  if (autoUpdatesEnabled) {
    importMap = {
      imports: {
        ...(await buildVendorDependencies({cwd: workDir, outputDir, basePath})),
        ...autoUpdatesImports,
      },
    }
  }

  try {
    timer.start('bundleStudio')

    const bundle = await buildStaticFiles({
      cwd: workDir,
      outputDir,
      basePath,
      sourceMap: Boolean(flags['source-maps']),
      minify: Boolean(flags.minify),
      vite: cliConfig && 'vite' in cliConfig ? cliConfig.vite : undefined,
      importMap,
      reactCompiler:
        cliConfig && 'reactCompiler' in cliConfig ? cliConfig.reactCompiler : undefined,
      entry: cliConfig && 'app' in cliConfig ? cliConfig.app?.entry : undefined,
      isApp: true,
    })

    trace.log({
      outputSize: bundle.chunks
        .flatMap((chunk) => chunk.modules.flatMap((mod) => mod.renderedLength))
        .reduce((sum, n) => sum + n, 0),
    })
    const buildDuration = timer.end('bundleStudio')

    spin.text = `Build Sanity application (${buildDuration.toFixed()}ms)`
    spin.succeed()

    trace.complete()
    if (flags.stats) {
      output.print('\nLargest module files:')
      output.print(formatModuleSizes(sortModulesBySize(bundle.chunks).slice(0, 15)))
    }
  } catch (err) {
    spin.fail()
    trace.error(err)
    throw err
  }

  return {didCompile: true}
}

// eslint-disable-next-line no-process-env
function getSanityEnvVars(env: Record<string, string | undefined> = process.env): string[] {
  return Object.keys(env).filter((key) => key.toUpperCase().startsWith('SANITY_APP_'))
}
