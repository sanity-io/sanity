import path from 'node:path'

import {type CliCommandDefinition} from '@sanity/cli'
import {
  DEFAULT_MUTATION_CONCURRENCY,
  dryRun,
  MAX_MUTATION_CONCURRENCY,
  type Migration,
  type MigrationProgress,
  run,
} from '@sanity/migrate'
import {Table} from 'console-table-printer'
import {register} from 'esbuild-register/dist/node'
import {hideBin} from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {debug} from '../../debug'
import {DEFAULT_API_VERSION, MIGRATIONS_DIRECTORY} from './constants'
import {resolveMigrations} from './listMigrationsCommand'
import {prettyFormat} from './prettyMutationFormatter'
import {ensureApiVersionFormat} from './utils/ensureApiVersionFormat'
import {isLoadableMigrationScript, resolveMigrationScript} from './utils/resolveMigrationScript'

const helpText = `
Options
  --no-dry-run By default the migration runs in dry mode. Pass this option to migrate dataset.
  --concurrency <concurrent> How many mutation requests to run in parallel. Must be between 1 and ${MAX_MUTATION_CONCURRENCY}. Default: ${DEFAULT_MUTATION_CONCURRENCY}.
  --no-progress Don't output progress. Useful if you want debug your migration script and see the output of console.log() statements.
  --dataset <dataset> Dataset to migrate. Defaults to the dataset configured in your Sanity CLI config.
  --project <project id> Project ID of the dataset to migrate. Defaults to the projectId configured in your Sanity CLI config.
  --api-version <version> API version to use when migrating. Defaults to ${DEFAULT_API_VERSION}.
  --no-confirm Skip the confirmation prompt before running the migration. Make sure you know what you're doing before using this flag.
  --from-export <export.tar.gz> Use a local dataset export as source for migration instead of calling the Sanity API. Note: this is only supported for dry runs.


Examples
  # dry run the migration
  sanity migration run <id>

  # execute the migration against a dataset
  sanity migration run <id> --no-dry-run --project xyz --dataset staging

  # execute the migration using a dataset export as the source
  sanity migration run <id>  --from-export=production.tar.gz --no-dry-run --projectId xyz --dataset staging
`

interface CreateFlags {
  ['dry-run']?: boolean
  concurrency?: number
  ['from-export']?: string
  progress?: boolean
  dataset?: string
  project?: string
  confirm?: boolean
}

function parseCliFlags(args: {argv?: string[]}) {
  return yargs(hideBin(args.argv || process.argv).slice(2))
    .options('dry-run', {type: 'boolean', default: true})
    .options('concurrency', {type: 'number', default: DEFAULT_MUTATION_CONCURRENCY})
    .options('progress', {type: 'boolean', default: true})
    .options('dataset', {type: 'string'})
    .options('from-export', {type: 'string'})
    .options('project', {type: 'string'})
    .options('api-version', {type: 'string'})
    .options('confirm', {type: 'boolean', default: true}).argv
}

const runMigrationCommand: CliCommandDefinition<CreateFlags> = {
  name: 'run',
  group: 'migration',
  signature: 'ID',
  helpText,
  description: 'Run a migration against a dataset',
  // eslint-disable-next-line max-statements
  action: async (args, context) => {
    const {apiClient, output, prompt, chalk, workDir} = context
    const [id] = args.argsWithoutOptions
    const migrationsDirectoryPath = path.join(workDir, MIGRATIONS_DIRECTORY)

    const flags = await parseCliFlags(args)

    const fromExport = flags.fromExport
    const dry = flags.dryRun
    const dataset = flags.dataset
    const project = flags.project
    const apiVersion = flags.apiVersion

    if ((dataset && !project) || (project && !dataset)) {
      throw new Error('If either --dataset or --project is provided, both must be provided')
    }

    if (!id) {
      output.error(chalk.red('Error: Migration ID must be provided'))
      const migrations = await resolveMigrations(workDir)
      const table = new Table({
        title: `Migrations found in project`,
        columns: [
          {name: 'id', title: 'ID', alignment: 'left'},
          {name: 'title', title: 'Title', alignment: 'left'},
        ],
      })

      migrations.forEach((definedMigration) => {
        table.addRow({id: definedMigration.id, title: definedMigration.migration.title})
      })
      table.printTable()
      output.print('\nRun `sanity migration run <ID>` to run a migration')

      return
    }

    if (!__DEV__) {
      register({
        target: `node${process.version.slice(1)}`,
        supported: {'dynamic-import': true},
      })
    }

    const candidates = resolveMigrationScript(workDir, id)
    const resolvedScripts = candidates.filter(isLoadableMigrationScript)

    if (resolvedScripts.length > 1) {
      // todo: consider prompt user about which one to run? note: it's likely a mistake if multiple files resolve to the same name
      throw new Error(
        `Found multiple migrations for "${id}" in ${chalk.cyan(migrationsDirectoryPath)}: \n - ${candidates
          .map((candidate) => path.relative(migrationsDirectoryPath, candidate.absolutePath))
          .join('\n - ')}`,
      )
    }

    const script = resolvedScripts[0]
    if (!script) {
      throw new Error(
        `No migration found for "${id}" in ${chalk.cyan(chalk.cyan(migrationsDirectoryPath))}. Make sure that the migration file exists and exports a valid migration as its default export.\n
 Tried the following files:\n - ${candidates
   .map((candidate) => path.relative(migrationsDirectoryPath, candidate.absolutePath))
   .join('\n - ')}`,
      )
    }

    const mod = script.mod
    if ('up' in mod || 'down' in mod) {
      // todo: consider adding support for up/down as separate named exports
      // For now, make sure we reserve the names for future use
      throw new Error(
        'Only "up" migrations are supported at this time, please use a default export',
      )
    }

    const migration: Migration = mod.default

    if (fromExport && !dry) {
      throw new Error('Can only dry run migrations from a dataset export file')
    }

    const concurrency = flags.concurrency
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

    const projectConfig = apiClient({
      requireUser: true,
      requireProject: false,
    }).config()

    if (!project && !projectConfig.projectId) {
      throw new Error(
        'sanity.cli.js does not contain a project identifier ("api.projectId") and no --project option was provided.',
      )
    }

    const apiConfig = {
      dataset: dataset ?? projectConfig.dataset!,
      projectId: project ?? projectConfig.projectId!,
      apiHost: projectConfig.apiHost!,
      token: projectConfig.token!,
      apiVersion: ensureApiVersionFormat(apiVersion ?? DEFAULT_API_VERSION),
    } as const
    if (dry) {
      dryRunHandler()
      return
    }

    output.print(
      `\n${chalk.yellow(chalk.bold('Note: During migrations, your webhooks stay active.'))}`,
    )
    output.print(
      `To adjust them, launch the management interface with ${chalk.cyan('sanity manage')}, navigate to the API settings, and toggle the webhooks before and after the migration as needed.\n`,
    )

    if (flags.confirm) {
      const response = await prompt.single<boolean>({
        message: `This migration will run on the ${chalk.yellow(
          chalk.bold(apiConfig.dataset),
        )} dataset in ${chalk.yellow(chalk.bold(apiConfig.projectId))} project. Are you sure?`,
        type: 'confirm',
      })

      if (!response) {
        debug('User aborted migration')
        return
      }
    }

    const spinner = output.spinner(`Running migration "${id}"`).start()
    await run({api: apiConfig, concurrency, onProgress: createProgress(spinner)}, migration)
    spinner.stop()

    function createProgress(progressSpinner: ReturnType<typeof output.spinner>) {
      return function onProgress(progress: MigrationProgress) {
        if (!flags.progress) {
          progressSpinner.stop()
          return
        }
        if (progress.done) {
          progressSpinner.text = `Migration "${id}" completed.

  Project id:  ${chalk.bold(apiConfig.projectId)}
  Dataset:     ${chalk.bold(apiConfig.dataset)}

  ${progress.documents} documents processed.
  ${progress.mutations} mutations generated.
  ${chalk.green(progress.completedTransactions.length)} transactions committed.`
          progressSpinner.stopAndPersist({symbol: chalk.green('✔')})
          return
        }

        ;[null, ...progress.currentTransactions].forEach((transaction) => {
          progressSpinner.text = `Running migration "${id}" ${dry ? 'in dry mode...' : '...'}

  Project id:     ${chalk.bold(apiConfig.projectId)}
  Dataset:        ${chalk.bold(apiConfig.dataset)}
  Document type:  ${chalk.bold(migration.documentTypes?.join(','))}

  ${progress.documents} documents processed…
  ${progress.mutations} mutations generated…
  ${chalk.blue(progress.pending)} requests pending…
  ${chalk.green(progress.completedTransactions.length)} transactions committed.

  ${
    transaction && !progress.done
      ? `» ${prettyFormat({chalk, subject: transaction, migration, indentSize: 2})}`
      : ''
  }`
        })
      }
    }

    async function dryRunHandler() {
      output.print(`Running migration "${id}" in dry mode`)

      if (fromExport) {
        output.print(`Using export ${chalk.cyan(fromExport)}`)
      }

      output.print()
      output.print(`Project id:  ${chalk.bold(apiConfig.projectId)}`)
      output.print(`Dataset:     ${chalk.bold(apiConfig.dataset)}`)

      for await (const mutation of dryRun({api: apiConfig, exportPath: fromExport}, migration)) {
        if (!mutation) continue
        output.print()
        output.print(
          prettyFormat({
            chalk,
            subject: mutation,
            migration,
          }),
        )
      }
    }
  },
}

export default runMigrationCommand
