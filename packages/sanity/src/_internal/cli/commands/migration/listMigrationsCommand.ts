import {readdir} from 'node:fs/promises'
import path from 'node:path'
import type {CliCommandDefinition} from '@sanity/cli'
import type {Migration} from '@sanity/migrate'
import chalk from 'chalk'
import {Table} from 'console-table-printer'
import {register} from 'esbuild-register/dist/node'
import {MIGRATIONS_DIRECTORY} from './constants'
import {resolveMigrationScript} from './utils'

const helpText = ``

const listMigrationCommand: CliCommandDefinition = {
  name: 'list',
  group: 'migration',
  signature: '',
  helpText,
  description: 'List available migrations',
  action: async (_, context) => {
    const {workDir, output} = context
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
        table.addRow({id: definedMigration.dirname, title: definedMigration.migration.title})
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
 * Resolves all migrations in the studio working directory
 *
 * @param workDir - The studio working directory
 * @returns Array of migrations and their respective paths
 * @internal
 */
export async function resolveMigrations(
  workDir: string,
): Promise<{dirname: string; migration: Migration}[]> {
  let unregister
  if (!__DEV__) {
    unregister = register({
      target: `node${process.version.slice(1)}`,
    }).unregister
  }

  const directories = (
    await readdir(path.join(workDir, MIGRATIONS_DIRECTORY), {withFileTypes: true})
  ).filter((ent) => ent.isDirectory())

  const entries = directories
    .map((ent) => {
      const candidates = resolveMigrationScript(workDir, ent.name)
      const found = candidates.find((candidate) => candidate.mod?.default)
      if (!found) {
        return null
      }
      return {
        dirname: ent.name,
        migration: found.mod.default as Migration,
      }
    })
    .filter(Boolean) as {dirname: string; migration: Migration}[]

  if (unregister) {
    unregister()
  }

  return entries
}

export default listMigrationCommand
