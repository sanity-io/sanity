import {readdir} from 'node:fs/promises'
import path from 'node:path'

import {type CliCommandDefinition} from '@sanity/cli'
import {type Migration} from '@sanity/migrate'
import {Table} from 'console-table-printer'
import {register} from 'esbuild-register/dist/node'

import {MIGRATION_SCRIPT_EXTENSIONS, MIGRATIONS_DIRECTORY} from './constants'
import {isLoadableMigrationScript, resolveMigrationScript} from './utils/resolveMigrationScript'

const helpText = ``

const listMigrationCommand: CliCommandDefinition = {
  name: 'list',
  group: 'migration',
  signature: '',
  helpText,
  description: 'List available migrations',
  action: async (_, context) => {
    const {workDir, output, chalk} = context
    try {
      const migrations = await resolveMigrations(workDir)

      if (migrations.length === 0) {
        output.print('No migrations found in migrations folder of the project')
        output.print(
          `\nRun ${chalk.green(`\`sanity migration create <NAME>\``)} to create a new migration`,
        )
        return
      }

      const table = new Table({
        title: `Found ${migrations.length} migrations in project`,
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
    } catch (error) {
      if (error.code === 'ENOENT') {
        output.print('No migrations folder found in the project')
        output.print(
          `\nRun ${chalk.green(`\`sanity migration create <NAME>\``)} to create a new migration`,
        )
        return
      }
      throw new Error(`An error occurred while listing migrations: ${error.message}`)
    }
  },
}

/**
 * A resolved migration, where you are guaranteed that the migration file exists
 *
 * @internal
 */
export interface ResolvedMigration {
  id: string
  migration: Migration
}

/**
 * Resolves all migrations in the studio working directory
 *
 * @param workDir - The studio working directory
 * @returns Array of migrations and their respective paths
 * @internal
 */
export async function resolveMigrations(workDir: string): Promise<ResolvedMigration[]> {
  let unregister
  if (!__DEV__) {
    unregister = register({
      target: `node${process.version.slice(1)}`,
      supported: {'dynamic-import': true},
    }).unregister
  }

  const migrationsDir = path.join(workDir, MIGRATIONS_DIRECTORY)
  const migrationEntries = await readdir(migrationsDir, {withFileTypes: true})

  const migrations: ResolvedMigration[] = []
  for (const entry of migrationEntries) {
    const entryName = entry.isDirectory() ? entry.name : removeMigrationScriptExtension(entry.name)
    const candidates = resolveMigrationScript(workDir, entryName).filter(isLoadableMigrationScript)

    for (const candidate of candidates) {
      migrations.push({
        id: entryName,
        migration: candidate.mod.default,
      })
    }
  }

  if (unregister) {
    unregister()
  }

  return migrations
}

function removeMigrationScriptExtension(fileName: string) {
  // Remove `.ts`, `.js` etc from the end of a filename
  return MIGRATION_SCRIPT_EXTENSIONS.reduce(
    (name, ext) => (name.endsWith(`.${ext}`) ? path.basename(name, `.${ext}`) : name),
    fileName,
  )
}

export default listMigrationCommand
