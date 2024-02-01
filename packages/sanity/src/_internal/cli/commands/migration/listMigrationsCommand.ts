import path from 'path'
import {readdir} from 'node:fs/promises'
import chalk from 'chalk'
import type {CliCommandDefinition} from '@sanity/cli'
import {register} from 'esbuild-register/dist/node'
import {Migration} from '@sanity/migrate'
import {Table} from 'console-table-printer'
import {resolveMigrationScript} from './utils'
import {MIGRATIONS_DIRECTORY} from './constants'

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

export async function resolveMigrations(workDir: string) {
  if (!__DEV__) {
    register({
      target: `node${process.version.slice(1)}`,
    })
  }

  const directories = (
    await readdir(path.join(workDir, MIGRATIONS_DIRECTORY), {withFileTypes: true})
  ).filter((ent) => ent.isDirectory())

  return directories
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
}

export default listMigrationCommand
