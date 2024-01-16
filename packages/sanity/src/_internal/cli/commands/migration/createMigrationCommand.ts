import path from 'path'
import fs from 'node:fs/promises'
import type {CliCommandDefinition} from '@sanity/cli'
import deburr from 'lodash/deburr'
import mkdirp from 'mkdirp'
import {MIGRATIONS_DIRECTORY} from './constants'
import {renameField} from './templates/renameField'
import {substituteTemplateVariables} from './utils/substituteVariables'
import {stringToPTE} from './templates/stringToPTE'

const helpText = `
Options
  --type <type> Type of migration (incremental/full)

Examples
  sanity migration create
  sanity migration create <name>
  sanity migration create <name> --type incremental
`

interface MigrateFlags {
  type?: 'incremental'
}

const TEMPLATES = [
  {name: 'Rename field', template: renameField},
  {name: 'Convert string field to Portable Text (TODO)', template: stringToPTE},
]

const createMigrationCommand: CliCommandDefinition<MigrateFlags> = {
  name: 'create',
  group: 'migration',
  signature: '[NAME]',
  helpText,
  description: 'Create a new content migration within your project',
  action: async (args, context) => {
    const {output, prompt, workDir} = context
    const flags = args.extOptions

    const name = await prompt.single({
      type: 'input',
      message: 'Name of migration (e.g. rename field from location to address)',
    })

    const docType = await prompt.single({
      type: 'input',
      message: 'Type of documents to migrate',
    })

    const scaffoldTests = await prompt.single({
      type: 'confirm',
      message: 'Do you want to scaffold tests for this migration?',
    })

    const template = await prompt.single({
      type: 'list',
      message: 'Select a template',
      choices: TEMPLATES.map((definedTemplate) => ({
        name: definedTemplate.name,
        value: definedTemplate.template,
      })),
    })

    const sluggedName = deburr(name.toLowerCase())
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const isUsingTS = await fs.stat(path.join(workDir, 'tsconfig.json'))

    const destDir = path.join(MIGRATIONS_DIRECTORY, sluggedName)
    mkdirp.sync(destDir)

    // todo: strip types from template and format with prettier
    const finalTemplate = substituteTemplateVariables(template, {
      migrationName: name,
      type: docType,
    })

    await fs.writeFile(path.join(destDir, 'index.ts'), finalTemplate)

    output.print(
      `Created migration "${name}" in ${destDir}. To dry run it, run \`sanity migration run ${sluggedName}\``,
    )
  },
}
export default createMigrationCommand
