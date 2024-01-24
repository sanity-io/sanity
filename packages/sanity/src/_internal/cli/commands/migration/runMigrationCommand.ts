import path from 'path'
import type {CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import {register} from 'esbuild-register/dist/node'
import {
  APIConfig,
  collectMigrationMutations,
  fromExportArchive,
  fromExportEndpoint,
  safeJsonParser,
  MAX_MUTATION_CONCURRENCY,
  DEFAULT_MUTATION_CONCURRENCY,
  Migration,
  ndjson,
  run,
} from '@sanity/migrate'
import {SanityDocument} from '@sanity/types'
import {Mutation} from '@bjoerge/mutiny'
import {debug} from '../../debug'
import {format, formatMutation} from './utils/mutationFormatter'

const helpText = `
Options
  --dry <boolean> Whether or not to dry run the migration. Default to true, to actually run the migration this has to be set to false
  --from-export <export.tar.gz> Use a local dataset export as source for migration instead of calling the Sanity API. Note: this is only supported for dry runs.
  --concurrency <concurrent> How many mutation requests to run in parallel. Must be between 1 and ${MAX_MUTATION_CONCURRENCY}. Default: ${DEFAULT_MUTATION_CONCURRENCY}.


Examples
  sanity migration run
  sanity migration run <name>
  sanity migration run <name> --dry false --from-export=production.tar.gz --projectId xyz --dataset staging
`

interface CreateFlags {
  dry?: 'true' | 'false' | 'yes' | 'no'
  'from-export'?: string
  concurrency?: number
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

    const concurrency = args.extOptions.concurrency
    if (concurrency !== undefined) {
      if (concurrency > MAX_MUTATION_CONCURRENCY) {
        throw new Error(
          `Concurrency exceeds the maximum allowed value of ${MAX_MUTATION_CONCURRENCY}`,
        )
      }

      if (concurrency === 0) {
        throw new Error(`Concurrency must be a positive number, got ${concurrency}`)
      }
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

    if (dry) {
      const spinner = output.spinner(`Running migration "${migrationName}" in dry mode`).start()
      await dryRun({api: apiConfig}, migration, context)

      spinner.stop()
    } else {
      const response = await prompt.single<boolean>({
        message: `This migration will run on the ${chalk.yellow(
          chalk.bold(apiConfig.dataset),
        )} dataset in ${chalk.yellow(chalk.bold(apiConfig.projectId))} project. Are you sure?`,
        type: 'confirm',
      })

      if (response === false) {
        debug('User aborted migration')
        return
      }

      const spinner = output.spinner(`Running migration "${migrationName}"`).start()

      await run(
        {
          api: apiConfig,
          concurrency,
          onProgress(progress) {
            if (progress.done) {
              spinner.text = `Migration "${migrationName}" completed.

  Project id:  ${chalk.bold(projectId)}
  Dataset:     ${chalk.bold(dataset)}

  ${progress.documents} documents processed.
  ${progress.mutations} mutations generated.
  ${chalk.green(progress.completedTransactions.length)} transactions committed.`
              spinner.stopAndPersist({symbol: chalk.green('✔')})
              return
            }

            ;['', ...progress.currentMutations].forEach((mutation) => {
              spinner.text = `Running migration "${migrationName}"…

  Project id:     ${chalk.bold(projectId)}
  Dataset:        ${chalk.bold(dataset)}
  Document type:  ${chalk.bold(migration.documentType)}

  ${progress.documents} documents processed…
  ${progress.mutations} mutations generated…
  ${chalk.blue(progress.pending)} requests pending…
  ${chalk.green(progress.completedTransactions.length)} transactions committed.

  ${
    mutation && !progress.done ? `» ${chalk.grey(formatMutation(chalk, mutation as Mutation))}` : ''
  }`
            })
          },
        },
        migration,
      )
      spinner.stop()
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
