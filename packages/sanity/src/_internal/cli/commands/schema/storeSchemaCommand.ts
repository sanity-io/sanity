import {type CliCommandArguments, type CliCommandDefinition} from '@sanity/cli'

import {type StoreManifestSchemasFlags} from '../../actions/schema/storeSchemasAction'

const description = 'Store schemas into workspace datasets.'

const helpText = `
**Note**: This command is experimental and subject to change.

Options:
  --workspace <workspace_name> store schema for a specific workspace
  --manifest-dir <directory> directory containing your manifest file if it's not in the default location
  --id-prefix <prefix> add a prefix to the schema ID
  --schema-required fail if schema file is not found
  --verbose print detailed information during store

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

    const extendedArgs = {
      ...args,
      extOptions: {
        ...args.extOptions,
        'schema-required': true,
      },
    }

    return mod.default(
      extendedArgs as unknown as CliCommandArguments<StoreManifestSchemasFlags>,
      context,
    )
  },
} satisfies CliCommandDefinition

export default storeSchemaCommand
