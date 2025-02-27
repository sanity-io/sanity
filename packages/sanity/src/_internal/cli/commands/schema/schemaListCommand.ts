import {type CliCommandArguments, type CliCommandDefinition} from '@sanity/cli'

import {type SchemaListFlags} from '../../actions/schema/schemaListAction'

const description = 'Lists all schemas in the current dataset.'

const helpText = `
**Note**: This command is experimental and subject to change.

Options
  --json get schemas as json
  --id <schema_id> fetch a specific schema by its ID
  --path <path> path to your manifest file if it's not in the default location

Examples
  # Get full json schemas
  sanity schema list --json

  # Get a specific schema by ID
  sanity schema list --id <schema_id>
`

const fetchSchemaCommand = {
  name: 'list',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/schemaListAction')

    return mod.default(args as unknown as CliCommandArguments<SchemaListFlags>, context)
  },
} satisfies CliCommandDefinition

export default fetchSchemaCommand
