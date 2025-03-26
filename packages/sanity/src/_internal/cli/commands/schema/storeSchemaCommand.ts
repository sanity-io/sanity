import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Store schema documents into workspace datasets.'

const helpText = `
**Note**: This command is experimental and subject to change.

This operation (re-)generates a manifest file describing the sanity config workspace by default.
To re-use an existing manifest file, use --no-extract-manifest.

Options:
  --workspace <workspace_name> store schema for a specific workspace
  --id-prefix <prefix> add a prefix to the schema id
  --manifest-dir <directory> directory containing manifest file (default: ./dist/static)
  --no-extract-manifest disables manifest generation – the command will fail if no manifest exists
  --verbose print detailed information during store

Examples
  # Store all workspace schemas
  sanity schema store

  # Store the schema for only the workspace 'default'
  sanity schema store --workspace default

  # Runs using a pre-existing manifest file
  # Config changes in sanity.config will not be picked up in this case
  sanity schema store --no-extract-manifest
`

const storeSchemaCommand = {
  name: 'store',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/storeSchemasAction')

    const result = await mod.default(args.extOptions, context)
    if (result === 'failure') process.exit(1)
    return result
  },
} satisfies CliCommandDefinition

export default storeSchemaCommand
