import path from 'path'
import {readdir} from 'node:fs/promises'
import type {CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import {register} from 'esbuild-register/dist/node'
import {Migration} from '@sanity/migrate'
import {Table} from 'console-table-printer'
import {resolveMigrationScript} from './utils'
import {MIGRATIONS_DIRECTORY} from './constants'

const helpText = ``

interface CreateFlags {
  dry?: 'true' | 'false' | 'yes' | 'no'
  'from-export'?: string
}

const createMigrationCommand: CliCommandDefinition<CreateFlags> = {
  name: 'list',
  group: 'migration',
  signature: '[NAME]',
  helpText,
  description: 'List available migrations',
  action: async (args, context) => {
    const {workDir, output} = context
    const migrations = await resolveMigrations(workDir)
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

export default createMigrationCommand
