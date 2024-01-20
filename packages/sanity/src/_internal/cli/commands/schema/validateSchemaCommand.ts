import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Validates all schema types specified in a workspace.'

const helpText = `
Options
  --workspace <name> The name of the workspace to use when validating all schema types.
  --format <pretty|ndjson|json> The output format used to print schema errors and warnings.
  --level <error|warning> The minimum level reported out. Defaults to warning.

Examples
  # Validates all schema types in a Sanity project with more than one workspace
  sanity schema validate --workspace default

  # Save the results of the report into a file
  sanity schema validate > report.txt

  # Report out only errors
  sanity schema validate --level error
`

const validateDocumentsCommand: CliCommandDefinition = {
  name: 'validate',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/validateAction')

    return mod.default(args, context)
  },
} satisfies CliCommandDefinition

export default validateDocumentsCommand
