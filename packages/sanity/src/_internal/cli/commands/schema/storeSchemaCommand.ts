import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Store schema documents into workspace datasets.'

const helpText = `
**Note**: This command is experimental and subject to change.

This operation requires a manifest file to exist: use --extract-manifest or run "sanity manifest extract" first.

Options:
  --workspace <workspace_name> store schema for a specific workspace
  --id-prefix <prefix> add a prefix to the schema id
  --schema-required fail if schema file is not found
  --manifest-dir <directory> directory containing manifest file (default: ./dist/static)
  --extract-manifest regenerates manifest file based on sanity.config; equivalent of running "sanity manifest extract" first
  --verbose print detailed information during store

Examples
  # Store all workspace schemas
  sanity schema store

  # Store the schema for only the workspace 'default'
  sanity schema store --workspace default

  # Ensure manifest file is up-to-date
  sanity schema store --extract-manifest
`

const storeSchemaCommand = {
  name: 'store',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/storeSchemasAction')

    const result = await mod.default(
      {
        ...args.extOptions,
        'schema-required': true,
      },
      context,
    )
    if (result === 'failure') process.exit(1)
    return result
  },
} satisfies CliCommandDefinition

export default storeSchemaCommand
