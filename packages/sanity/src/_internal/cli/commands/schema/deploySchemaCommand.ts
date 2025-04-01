import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Deploy schema documents into workspace datasets.'

const helpText = `
**Note**: This command is experimental and subject to change.

This operation (re-)generates a manifest file describing the sanity config workspace by default.
To re-use an existing manifest file, use --no-extract-manifest.

Options:
  --workspace <workspace_name> deploy schema for a specific workspace
  --id-prefix <prefix> add a prefix to the schema id
  --manifest-dir <directory> directory containing manifest file (default: ./dist/static)
  --no-extract-manifest disables manifest generation – the command will fail if no manifest exists
  --verbose print detailed information during deployment

Examples
  # Deploy all workspace schemas
  sanity schema deploy

  # Deploy the schema for only the workspace 'default'
  sanity schema deploy --workspace default

  # Runs using a pre-existing manifest file
  # Config changes in sanity.config will not be picked up in this case
  sanity schema deploy --no-extract-manifest
`

const deploySchemaCommand = {
  name: 'deploy',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/deploySchemasAction')

    const result = await mod.default(args.extOptions, context)
    if (result === 'failure') process.exit(1)
    return result
  },
} satisfies CliCommandDefinition

export default deploySchemaCommand
