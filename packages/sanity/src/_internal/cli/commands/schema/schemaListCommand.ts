import {type CliCommandArguments, type CliCommandDefinition} from '@sanity/cli'

import {type SchemaListFlags} from '../../actions/schema/schemaListAction'

const description = 'Lists all schemas in the current dataset.'

const helpText = `
**Note**: This command is experimental and subject to change.

Lists all schemas in the current dataset.

Options
  --json get schemas as json
  --id <schema_id> fetch a specific schema by its ID

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
