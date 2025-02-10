import {type CliCommandArguments, type CliCommandDefinition} from '@sanity/cli'

import {type StoreManifestSchemasFlags} from '../../actions/schema/storeSchemasAction'

const description = ''

const helpText = `
**Note**: This command is experimental and subject to change.

Options:
  --workspace The name of the workspace to fetch the stored schema for
  --path If you are not using the default static file path, you can specify it here.
  --custom-id you can specify a custom id for the schema. Useful if you want to store the schema in a different path than the default one.

Examples
  # if no options are provided all workspace schemas will be stored
  sanity schema store
  # Store the schema for only the workspace 'default'
  sanity schema store --workspace default
`

const storeSchemaCommand = {
  name: 'store',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/storeSchemasAction')

    return mod.default(args as unknown as CliCommandArguments<StoreManifestSchemasFlags>, context)
  },
} satisfies CliCommandDefinition

export default storeSchemaCommand
