import path from 'path'
import type {CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import {register} from 'esbuild-register/dist/node'
import {
  APIConfig,
  collectMigrationMutations,
  fromExportArchive,
  fromExportEndpoint,
  safeJsonParser,
  Migration,
  ndjson,
  run,
} from '@sanity/migrate'
import {SanityDocument} from '@sanity/types'
import {format} from './mutationFormatter'

const helpText = `
Options
  --dryRun <boolean> Whether or not to dry run the migration. Default to true, to actually run the migration this has to be set to false

Examples
  sanity migration run
  sanity migration run <name>
  sanity migration run <name> --dry false --from-export=production.tar.gz --projectId xyz --dataset staging
`

interface CreateFlags {
  dry?: 'true' | 'false' | 'yes' | 'no'
  'from-export'?: string
}

const tryExtensions = ['mjs', 'js', 'ts', 'cjs']

function resolveMigrationScript(workDir: string, migrationName: string) {
  return [migrationName, path.join(migrationName, 'index')].flatMap((location) =>
    tryExtensions.map((ext) => {
      const relativePath = path.join('migrations', `${location}.${ext}`)
      const absolutePath = path.resolve(workDir, relativePath)
      let mod
      try {
        // eslint-disable-next-line import/no-dynamic-require
        mod = require(absolutePath)
      } catch (err) {
        // console.error(err)
      }
      return {relativePath, absolutePath, mod}
    }),
  )
}

const createMigrationCommand: CliCommandDefinition<CreateFlags> = {
  name: 'run',
  group: 'migration',
  signature: '[NAME] [MIGRATION NAME]',
  helpText,
  description: 'Run a migration against a dataset',
  action: async (args, context) => {
    const {apiClient, output, prompt, chalk, workDir} = context
    const [migrationName] = args.argsWithoutOptions
    const [fromExport, dry] = [args.extOptions['from-export'], args.extOptions.dry !== 'false']

    if (!migrationName) {
      throw new Error('MIGRATION NAME must be provided. `sanity migration run <name>`')
    }

    if (!__DEV__) {
      register({
        target: `node${process.version.slice(1)}`,
      })
    }

    const candidates = resolveMigrationScript(workDir, migrationName)

    const resolvedScripts = candidates.filter((candidate) => candidate!.mod?.default)

    if (resolvedScripts.length > 1) {
      // todo: consider prompt user about which one to run? note: it's likely a mistake if multiple files resolve to the same name
      throw new Error(
        `Found multiple migrations for "${migrationName}" in current directory ${candidates
          .map((candidate) => candidate!.relativePath)
          .join(', ')}`,
      )
    }
    if (resolvedScripts.length === 0) {
      throw new Error(
        `No migration found for "${migrationName}" in current directory. Make sure that the migration file exists and exports a valid migration as its default export.\n
 Tried the following files:\n -${candidates
   .map((candidate) => candidate.relativePath)
   .join('\n - ')}`,
      )
    }
    const script = resolvedScripts[0]!

    const mod = script!.mod
    if ('up' in mod || 'down' in mod) {
      // todo: consider adding support for up/down as separate named exports
      // For now, make sure we reserve the names for future use
      throw new Error(
        'Only "up" migrations are supported at this time, please use a default export',
      )
    }

    const migration: Migration = mod.default

    if (fromExport && dry) {
      output.print('Running migration from archive…')
      await runFromArchive(migration, fromExport, context)
      return
    }

    if (fromExport && !dry) {
      throw new Error('Can only dry run migrations from a dataset export file')
    }

    const {dataset, projectId, apiHost, token} = apiClient({
      requireUser: true,
      requireProject: true,
    }).config()

    const apiConfig = {
      dataset: dataset!,
      projectId: projectId!,
      apiHost,
      token: token!,
      apiVersion: 'v2024-01-09',
    } as const

    const progress = dry
      ? dryRun({api: apiConfig}, migration, context)
      : run({api: apiConfig}, migration)

    for await (const result of progress) {
      output.print(result)
    }
  },
}

async function runFromArchive(
  migration: Migration,
  archive: string,
  {output, chalk}: CliCommandContext,
) {
  const mutations = collectMigrationMutations(
    migration,
    ndjson(fromExportArchive(archive)) as AsyncIterableIterator<SanityDocument>,
  )

  for await (const mutation of mutations) {
    if (!mutation) continue
    output.print()
    output.print(format(chalk, Array.isArray(mutation) ? mutation : ([mutation] as any)))
  }

  output.print('Done!')
}

interface MigrationRunnerOptions {
  api: APIConfig
}

async function* dryRun(
  config: MigrationRunnerOptions,
  migration: Migration,
  {output, chalk}: CliCommandContext,
) {
  const mutations = collectMigrationMutations(
    migration,
    ndjson<SanityDocument>(await fromExportEndpoint(config.api), {
      parse: safeJsonParser,
    }),
  )

  for await (const mutation of mutations) {
    if (!mutation) continue
    yield format(chalk, Array.isArray(mutation) ? mutation : ([mutation] as any))
  }
}

export default createMigrationCommand
