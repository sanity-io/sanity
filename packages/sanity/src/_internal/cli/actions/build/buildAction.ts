import path from 'node:path'
import {promisify} from 'node:util'

import chalk from 'chalk'
import {info} from 'log-symbols'
import {noopLogger} from '@sanity/telemetry'
import rimrafCallback from 'rimraf'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore This may not yet be built.
import type {CliCommandArguments, CliCommandContext} from '@sanity/cli'
import resolveFrom from 'resolve-from'

import {buildStaticFiles, ChunkModule, ChunkStats} from '../../server'
import {checkStudioDependencyVersions} from '../../util/checkStudioDependencyVersions'
import {checkRequiredDependencies} from '../../util/checkRequiredDependencies'
import {getTimer} from '../../util/timing'
import {BuildTrace} from './build.telemetry'
import {build} from 'vite'

const rimraf = promisify(rimrafCallback)

// TODO: replace this with a manifest somewhere
const AUTO_UPDATES_IMPORTMAP = {
  imports: {
    // Shared modules
    'react': '/deps/react/index.mjs',
    'react/jsx-runtime': '/deps/react/jsx-runtime.mjs',
    'react-dom': '/deps/react-dom/index.mjs',
    'react-dom/server': '/deps/react-dom/server.mjs',
    'react-dom/client': '/deps/react-dom/client.mjs',
    'styled-components': '/deps/styled-components/index.mjs',

    // Sanity Modules
    'sanity': 'https://api.sanity.work/v1/modules/sanity/^3',
    'sanity/': 'https://api.sanity.work/v1/modules/sanity/^3/',
    '@sanity/vision': 'https://api.sanity.work/v1/modules/@sanity__vision/^3 ',
  },
}

export interface BuildSanityStudioCommandFlags {
  'yes'?: boolean
  'y'?: boolean
  'minify'?: boolean
  'stats'?: boolean
  'source-maps'?: boolean
  'enable-auto-updates'?: boolean
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

  const unattendedMode = Boolean(flags.yes || flags.y)
  const defaultOutputDir = path.resolve(path.join(workDir, 'dist'))
  const outputDir = path.resolve(args.argsWithoutOptions[0] || defaultOutputDir)

  await checkStudioDependencyVersions(workDir)

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  if ((await checkRequiredDependencies(context)).didInstall) {
    return {didCompile: false}
  }

  const enableAutoUpdates =
    flags['enable-auto-updates'] ||
    (cliConfig && 'unstable_enableAutoUpdates' in cliConfig && cliConfig.unstable_enableAutoUpdates)

  if (enableAutoUpdates) {
    output.print(`${info} Building with auto-updates enabled`)
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

  spin = output.spinner('Build Sanity Studio').start()

  const trace = telemetry.trace(BuildTrace)
  trace.start()
  try {
    timer.start('bundleStudio')

    const bundle = await buildStaticFiles({
      cwd: workDir,
      outputDir,
      basePath,
      sourceMap: Boolean(flags['source-maps']),
      minify: Boolean(flags.minify),
      vite: cliConfig && 'vite' in cliConfig ? cliConfig.vite : undefined,
      importMap: enableAutoUpdates ? AUTO_UPDATES_IMPORTMAP : undefined,
    })

    // TODO: add error handling if the paths aren't found
    const entry = {
      'react/index': resolveFrom.silent(
        workDir,
        './node_modules/react/cjs/react.production.min.js',
      )!,
      'react/jsx-runtime': resolveFrom.silent(
        workDir,
        './node_modules/react/cjs/react-jsx-runtime.production.min.js',
      )!,
      'styled-components/index': resolveFrom.silent(
        workDir,
        './node_modules/styled-components/dist/styled-components.esm.js',
      )!,
      'react-dom/index': resolveFrom.silent(
        workDir,
        './node_modules/react-dom/cjs/react-dom.production.min.js',
      )!,
      'react-dom/client': resolveFrom.silent(
        workDir,
        './node_modules/react-dom/cjs/react-dom.production.min.js',
      )!,
      'react-dom/server': resolveFrom.silent(
        workDir,
        './node_modules/react-dom/cjs/react-dom-server-legacy.browser.production.min.js',
      )!,
    }

    // TODO: lift out of here
    await build({
      appType: 'custom',
      define: {
        'process.env.NODE_ENV': '"production"',
      },

      build: {
        outDir: path.resolve(outputDir, './deps'),
        lib: {
          entry,
          formats: ['es'],
        },
        rollupOptions: {
          external: ['react', /^react\//, 'react-dom', /^react-dom\//, 'styled-components'],
          output: {exports: 'named', format: 'es'},
          treeshake: {preset: 'recommended'},
        },
      },
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

function sortModulesBySize(chunks: ChunkStats[]): ChunkModule[] {
  return chunks
    .flatMap((chunk) => chunk.modules)
    .sort((modA, modB) => modB.renderedLength - modA.renderedLength)
}

function formatModuleSizes(modules: ChunkModule[]): string {
  const lines: string[] = []
  for (const mod of modules) {
    lines.push(` - ${formatModuleName(mod.name)} (${formatSize(mod.renderedLength)})`)
  }

  return lines.join('\n')
}

function formatModuleName(modName: string): string {
  const delimiter = '/node_modules/'
  const nodeIndex = modName.lastIndexOf(delimiter)
  return nodeIndex === -1 ? modName : modName.slice(nodeIndex + delimiter.length)
}

function formatSize(bytes: number): string {
  return chalk.cyan(`${(bytes / 1024).toFixed()} kB`)
}
