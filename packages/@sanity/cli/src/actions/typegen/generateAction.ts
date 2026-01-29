import {stat} from 'node:fs/promises'

import {
  configDefinition,
  readConfig,
  runTypegenGenerate,
  runTypegenWatcher,
  type TypeGenConfig,
} from '@sanity/codegen'
import chalk from 'chalk'
import {omit, once} from 'lodash-es'

import {type CliCommandArguments, type CliCommandContext} from '../../types'
import {getCliConfig} from '../../util/getCliConfig'
import {promiseWithResolvers} from '../../util/promiseWithResolvers'
import {TypegenWatchModeTrace, TypesGeneratedTrace} from './generate.telemetry'

export interface TypegenGenerateTypesCommandFlags {
  'config-path'?: string
  'watch'?: boolean
}

async function getConfig(
  workDir: string,
  configPath?: string,
): Promise<{config: TypeGenConfig; path?: string; type: 'legacy' | 'cli'}> {
  const config = await getCliConfig(workDir)

  // check if the legacy config exist
  const legacyConfigPath = configPath || 'sanity-typegen.json'
  let hasLegacyConfig = false
  try {
    const file = await stat(legacyConfigPath)
    hasLegacyConfig = file.isFile()
  } catch (err) {
    if (err.code === 'ENOENT' && configPath) {
      throw new Error(`Typegen config file not found: ${configPath}`, {cause: err})
    }

    if (err.code !== 'ENOENT') {
      throw new Error(`Error when checking if typegen config file exists: ${legacyConfigPath}`, {
        cause: err,
      })
    }
  }

  // we have both legacy and cli config with typegen
  if (config?.config?.typegen && hasLegacyConfig) {
    console.warn(
      chalk.yellow(
        `You've specified typegen in your Sanity CLI config, but also have a typegen config.

The config from the Sanity CLI config is used.
`,
      ),
    )

    return {
      config: configDefinition.parse(config.config.typegen || {}),
      path: config.path,
      type: 'cli',
    }
  }

  // we only have legacy typegen config
  if (hasLegacyConfig) {
    console.warn(
      chalk.yellow(
        `The separate typegen config has been deprecated. Use \`typegen\` in the sanity CLI config instead.

See: https://www.sanity.io/docs/help/configuring-typegen-in-sanity-cli-config`,
      ),
    )
    return {
      config: await readConfig(legacyConfigPath),
      path: legacyConfigPath,
      type: 'legacy',
    }
  }

  // we only have cli config
  return {
    config: configDefinition.parse(config?.config?.typegen || {}),
    path: config?.path,
    type: 'cli',
  }
}

async function runSingle(
  {extOptions: flags}: CliCommandArguments<TypegenGenerateTypesCommandFlags>,
  context: CliCommandContext,
) {
  const {output, workDir, telemetry} = context

  const trace = telemetry.trace(TypesGeneratedTrace)
  trace.start()

  try {
    const spinner = output.spinner({}).start('Loading config…')

    const {
      config: typegenConfig,
      type: typegenConfigMethod,
      path: configPath,
    } = await getConfig(workDir, flags['config-path'])

    spinner.succeed(`Config loaded from ${configPath?.replace(workDir, '.')}`)

    const result = await runTypegenGenerate({
      config: typegenConfig,
      workDir: context.workDir,
    })
    const traceStats = omit(result, 'code', 'duration')

    trace.log({
      ...traceStats,
      configMethod: typegenConfigMethod,
      configOverloadClientMethods: typegenConfig.overloadClientMethods,
    })
  } catch (error) {
    trace.error(error as Error)
    throw error
  } finally {
    trace.complete()
  }
}

async function runWatcher(
  {extOptions: flags}: CliCommandArguments<TypegenGenerateTypesCommandFlags>,
  context: CliCommandContext,
) {
  const {output, workDir, telemetry} = context

  const trace = telemetry.trace(TypegenWatchModeTrace)
  trace.start()

  try {
    const spinner = output.spinner({}).start('Loading config…')

    const {config: typegenConfig, path: configPath} = await getConfig(workDir, flags['config-path'])

    spinner.succeed(`Config loaded from ${configPath?.replace(workDir, '.')}`)

    const {promise, resolve} = promiseWithResolvers<void>()

    const typegenWatcher = runTypegenWatcher({
      config: typegenConfig,
      workDir,
      spin: spinner,
    })

    const stop = once(async () => {
      process.off('SIGINT', stop)
      process.off('SIGTERM', stop)

      trace.log({
        step: 'stopped',
        ...typegenWatcher.getStats(),
      })

      await typegenWatcher.stop()
      resolve()
    })

    process.on('SIGINT', stop)
    process.on('SIGTERM', stop)

    await promise
  } catch (error) {
    trace.error(error as Error)
    throw error
  } finally {
    trace.complete()
  }
}

export default async function typegenGenerateAction(
  args: CliCommandArguments<TypegenGenerateTypesCommandFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {extOptions: flags} = args

  if (flags.watch) {
    await runWatcher(args, context)
    return
  }

  await runSingle(args, context)
}
