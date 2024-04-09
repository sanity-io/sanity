import {existsSync, mkdirSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'
import path from 'node:path'

import {type CliCommandDefinition} from '@sanity/cli'
import {deburr} from 'lodash'

import {MIGRATIONS_DIRECTORY} from './constants'
import {minimalAdvanced} from './templates/minimalAdvanced'
import {minimalSimple} from './templates/minimalSimple'
import {renameField} from './templates/renameField'
import {renameType} from './templates/renameType'
import {stringToPTE} from './templates/stringToPTE'

const helpText = `
Examples:
  # Create a new migration, prompting for title and options
  sanity migration create

  # Create a new migration with the provided title, prompting for options
  sanity migration create "Rename field from location to address"
`

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CreateMigrationFlags {}

const TEMPLATES = [
  {name: 'Minimalistic migration to get you started', template: minimalSimple},
  {name: 'Rename an object type', template: renameType},
  {name: 'Rename a field', template: renameField},
  {name: 'Convert string field to Portable Text', template: stringToPTE},
  {
    name: 'Advanced template using async iterators providing more fine grained control',
    template: minimalAdvanced,
  },
]

const createMigrationCommand: CliCommandDefinition<CreateMigrationFlags> = {
  name: 'create',
  group: 'migration',
  signature: '[TITLE]',
  helpText,
  description: 'Create a new migration within your project',
  action: async (args, context) => {
    const {output, prompt, workDir, chalk} = context

    let [title] = args.argsWithoutOptions

    while (!title?.trim()) {
      title = await prompt.single({
        type: 'input',
        suffix: ' (e.g. "Rename field from location to address")',
        message: 'Title of migration',
      })
      if (!title.trim()) {
        output.error(chalk.red('Name cannot be empty'))
      }
    }
    const types = await prompt.single({
      type: 'input',
      suffix: ' (optional)',
      message: 'Type of documents to migrate. You can add multiple types separated by comma',
    })

    const templatesByName = Object.fromEntries(TEMPLATES.map((t) => [t.name, t]))
    const template = await prompt.single({
      type: 'list',
      message: 'Select a template',
      choices: TEMPLATES.map((definedTemplate) => ({
        name: definedTemplate.name,
        value: definedTemplate.name,
      })),
    })

    const sluggedName = deburr(title.toLowerCase())
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const destDir = path.join(workDir, MIGRATIONS_DIRECTORY, sluggedName)
    if (existsSync(destDir)) {
      if (
        !(await prompt.single({
          type: 'confirm',
          message: `Migration directory ${chalk.cyan(destDir)} already exists. Overwrite?`,
          default: false,
        }))
      ) {
        return
      }
    }
    mkdirSync(destDir, {recursive: true})

    const renderedTemplate = (templatesByName[template].template || minimalSimple)({
      migrationName: title,
      documentTypes: types
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })

    const definitionFile = path.join(destDir, 'index.ts')

    await writeFile(definitionFile, renderedTemplate)
    // To dry run it, run \`sanity migration run ${sluggedName}\``)
    output.print()
    output.print(`${chalk.green('✓')} Migration created!`)
    output.print()
    output.print('Next steps:')
    output.print(
      `Open ${chalk.bold(
        definitionFile,
      )} in your code editor and write the code for your migration.`,
    )
    output.print(
      `Dry run the migration with:\n\`${chalk.bold(
        `sanity migration run ${sluggedName} --project=<projectId> --dataset <dataset> `,
      )}\``,
    )
    output.print(
      `Run the migration against a dataset with:\n \`${chalk.bold(
        `sanity migration run ${sluggedName} --project=<projectId> --dataset <dataset> --no-dry-run`,
      )}\``,
    )
    output.print()
    output.print(
      `👉 Learn more about schema and content migrations at ${chalk.bold(
        'https://www.sanity.io/docs/schema-and-content-migrations',
      )}`,
    )
  },
}
export default createMigrationCommand
