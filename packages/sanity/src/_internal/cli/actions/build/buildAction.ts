import path from 'node:path'

import chalk from 'chalk'
import {info} from 'log-symbols'
import semver from 'semver'
import {noopLogger} from '@sanity/telemetry'
import {rimraf} from 'rimraf'
import type {CliCommandArguments, CliCommandContext} from '@sanity/cli'

import {buildStaticFiles} from '../../server'
import {checkStudioDependencyVersions} from '../../util/checkStudioDependencyVersions'
import {checkRequiredDependencies} from '../../util/checkRequiredDependencies'
import {getTimer} from '../../util/timing'
import {BuildTrace} from './build.telemetry'
import {buildVendorDependencies} from '../../server/buildVendorDependencies'
import {compareDependencyVersions} from '../../util/compareDependencyVersions'
import {getStudioAutoUpdateImportMap} from '../../util/getAutoUpdatesImportMap'
import {shouldAutoUpdate} from '../../util/shouldAutoUpdate'
import {formatModuleSizes, sortModulesBySize} from '../../util/moduleFormatUtils'
import {upgradePackages} from '../../util/packageManager/upgradePackages'
import {getPackageManagerChoice} from '../../util/packageManager/packageManagerChoice'
import {isInteractive} from '../../util/isInteractive'

export interface BuildSanityStudioCommandFlags {
  'yes'?: boolean
  'y'?: boolean
  'minify'?: boolean
  'stats'?: boolean
  'source-maps'?: boolean
  'auto-updates'?: boolean
}

export default async function buildSanityStudio(
  args: CliCommandArguments<BuildSanityStudioCommandFlags>,
  context: CliCommandContext,
  overrides?: {basePath?: string},
): Promise<{didCompile: boolean}> {
  const timer = getTimer()
  const {output, prompt, workDir, cliConfig, telemetry = noopLogger} = context
  const flags: BuildSanityStudioCommandFlags = {
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

  await checkStudioDependencyVersions(workDir)

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  const {didInstall, installedSanityVersion} = await checkRequiredDependencies(context)
  if (didInstall) {
    return {didCompile: false}
  }

  const autoUpdatesEnabled = shouldAutoUpdate({flags, cliConfig, output})

  // Get the version without any tags if any
  const coercedSanityVersion = semver.coerce(installedSanityVersion)?.version
  if (autoUpdatesEnabled && !coercedSanityVersion) {
    throw new Error(`Failed to parse installed Sanity version: ${installedSanityVersion}`)
  }
  const version = encodeURIComponent(`^${coercedSanityVersion}`)
  const autoUpdatesImports = getStudioAutoUpdateImportMap(version)

  if (autoUpdatesEnabled) {
    output.print(`${info} Building with auto-updates enabled`)

    // Check the versions
    const result = await compareDependencyVersions(autoUpdatesImports, workDir)

    if (result?.length) {
      const warning =
        `The following local package versions are different from the versions currently served at runtime.\n` +
        `When using auto updates, we recommend that you test locally with the same versions before deploying. \n\n` +
        `${result.map((mod) => ` - ${mod.pkg} (local version: ${mod.installed}, runtime version: ${mod.remote})`).join('\n')} \n\n`

      // If it is non-interactive or in unattended mode, we don't want to prompt
      if (isInteractive && !unattendedMode) {
        const choice = await prompt.single({
          type: 'list',
          message: chalk.yellow(
            `${warning}\n\nDo you want to upgrade local versions before deploying?`,
          ),
          choices: [
            {
              type: 'choice',
              value: 'upgrade',
              name: `Upgrade local versions (recommended). You will need to run the ${args.groupOrCommand} command again`,
            },
            {
              type: 'choice',
              value: 'upgrade-and-proceed',
              name: `Upgrade and proceed with ${args.groupOrCommand}`,
            },
            {
              type: 'choice',
              value: 'continue',
              name: `Continue anyway`,
            },
            {type: 'choice', name: 'Cancel', value: 'cancel'},
          ],
          default: 'upgrade-and-proceed',
        })

        if (choice === 'cancel') {
          return {didCompile: false}
        }

        if (choice === 'upgrade' || choice === 'upgrade-and-proceed') {
          await upgradePackages(
            {
              packageManager: (await getPackageManagerChoice(workDir, {interactive: false})).chosen,
              packages: result.map((res) => [res.pkg, res.remote]),
            },
            context,
          )

          if (choice !== 'upgrade-and-proceed') {
            return {didCompile: false}
          }
        }
      } else {
        // if non-interactive or unattended, just show the warning
        console.warn(`WARNING: ${warning}`)
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
  const envBasePath = process.env.SANITY_STUDIO_BASEPATH
  const configBasePath = cliConfig?.project?.basePath

  // Allow `sanity deploy` to override base path
  if (overrides?.basePath) {
    basePath = overrides.basePath
  } else if (envBasePath) {
    // Environment variable (SANITY_STUDIO_BASEPATH)
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

  spin = output.spinner(`Build Sanity Studio`).start()

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
    })

    trace.log({
      outputSize: bundle.chunks
        .flatMap((chunk) => chunk.modules.flatMap((mod) => mod.renderedLength))
        .reduce((sum, n) => sum + n, 0),
    })
    const buildDuration = timer.end('bundleStudio')

    spin.text = `Build Sanity Studio (${buildDuration.toFixed()}ms)`
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
  return Object.keys(env).filter((key) => key.toUpperCase().startsWith('SANITY_STUDIO_'))
}
