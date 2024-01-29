import path from 'path'
import {readdir} from 'node:fs/promises'
import type {CliCommandDefinition} from '@sanity/cli'
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
    const {output, workDir} = context

    if (!__DEV__) {
      register({
        target: `node${process.version.slice(1)}`,
      })
    }

    const directories = (
      await readdir(path.join(workDir, MIGRATIONS_DIRECTORY), {withFileTypes: true})
    ).filter((ent) => ent.isDirectory())

    const migrationModules = directories
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
    const table = new Table({
      title: `Found ${migrationModules.length} migrations in project`,
      columns: [
        {name: 'id', title: 'ID', alignment: 'left'},
        {name: 'name', title: 'Title', alignment: 'left'},
      ],
    })

    migrationModules.forEach((definedMigration) => {
      table.addRow({id: definedMigration.dirname, title: definedMigration.migration.title})
    })
    table.printTable()
    output.print(`\nRun "sanity migration run <MIGRATION ID>" to run a migration`)
  },
}

export default createMigrationCommand
