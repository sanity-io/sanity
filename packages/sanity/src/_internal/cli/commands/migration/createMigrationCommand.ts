import path from 'path'
import fs from 'node:fs/promises'
import type {CliCommandDefinition} from '@sanity/cli'
import deburr from 'lodash/deburr'
import mkdirp from 'mkdirp'
import {MIGRATIONS_DIRECTORY} from './constants'
import {renameField} from './templates/renameField'
import {substituteTemplateVariables} from './utils/substituteVariables'
import {stringToPTE} from './templates/stringToPTE'
import {cleanSimple} from './templates/clean-simple'
import {cleanAdvanced} from './templates/clean-advanced'

const helpText = `
Examples
  sanity migration create
  sanity migration create <name>
`

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CreateMigrationFlags {
  // todo
}

const TEMPLATES = [
  {name: 'Rename field', template: renameField},
  {name: 'Convert string field to Portable Text', template: stringToPTE},
  {name: 'Clean simple migration to get you started', template: cleanSimple},
  {
    name: 'Advanced template using async iterators providing more fine grained control',
    template: cleanAdvanced,
  },
]

const createMigrationCommand: CliCommandDefinition<CreateMigrationFlags> = {
  name: 'create',
  group: 'migration',
  signature: '[NAME]',
  helpText,
  description: 'Create a new content migration within your project',
  action: async (args, context) => {
    const {output, prompt, workDir, chalk} = context
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

    const definitionFile = path.join(destDir, 'index.ts')

    await fs.writeFile(definitionFile, finalTemplate)
    // To dry run it, run \`sanity migration run ${sluggedName}\``)
    output.print()
    output.print(`Migration created!`)
    output.print('Next steps:')
    output.print(
      `- Open ${chalk.bold(definitionFile)} in your code editor and write your migration`,
    )
    output.print(
      `- Dry run the migration with \`${chalk.bold(
        `sanity migrate ${sluggedName}}`,
      )}\` --project-id=[PROJECT ID] --dataset <DATASET> `,
    )
    output.print(
      `- Run the migration against a dataset with \`${chalk.bold(
        `sanity migrate ${sluggedName}}`,
      )}\` --project-id=[PROJECT ID] --dataset <DATASET> --dry-run false`,
    )
  },
}
export default createMigrationCommand
