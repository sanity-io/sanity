import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Lists all schemas in the current dataset.'

const helpText = `
**Note**: This command is experimental and subject to change.

This operation (re-)generates a manifest file describing the sanity config workspace by default.
To re-use an existing manifest file, use --no-extract-manifest.

Options
  --json get schema as json
  --id <schema_id> fetch a single schema by id
  --manifest-dir <directory> directory containing manifest file (default: ./dist/static)
  --no-extract-manifest disables manifest generation – the command will fail if no manifest exists

Examples
  # List all schemas found in any workspace dataset in a table
  sanity schema list

  # Get a schema for a given id
  sanity schema list --id sanity.workspace.schema.workspaceName

  # Get stored schemas as pretty-printed json-array
  sanity schema list --json

  # Get singular stored schema as pretty-printed json-object
  sanity schema list --json --id sanity.workspace.schema.workspaceName

  # Runs using a pre-existing manifest file
  # Config changes in sanity.config will not be picked up in this case
  sanity schema list --no-extract-manifest
`

const fetchSchemaCommand = {
  name: 'list',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/listSchemasAction')
    const result = await mod.default(args.extOptions, context)
    if (result === 'failure') process.exit(1)
    return result
  },
} satisfies CliCommandDefinition

export default fetchSchemaCommand
