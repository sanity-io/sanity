import {type CliCommandArguments, type CliCommandDefinition} from '@sanity/cli'

import {type FetchSchemaFlags} from '../../actions/schema/fetchSchemaAction'

const description = 'Extracts a JSON representation of a Sanity schema within a Studio context.'

const helpText = `
**Note**: This command is experimental and subject to change.

Options
  --id id of the schema to fetch

Examples
  # Fetch the stored schema for the workspace 'default' in the dataset 'sanity-test'
  sanity schema fetch --id sanity.workspace.schema.default
`

const fetchSchemaCommand = {
  name: 'fetch',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/fetchSchemaAction')

    return mod.default(args as unknown as CliCommandArguments<FetchSchemaFlags>, context)
  },
} satisfies CliCommandDefinition

export default fetchSchemaCommand
