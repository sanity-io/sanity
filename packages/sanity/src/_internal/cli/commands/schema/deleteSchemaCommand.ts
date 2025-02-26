import {type CliCommandArguments, type CliCommandDefinition} from '@sanity/cli'

import {type DeleteSchemaFlags} from '../../actions/schema/deleteSchemaAction'

const description = 'Delete schemas by their IDs.'

const helpText = `
**Note**: This command is experimental and subject to change.

Options
  --ids <schema_id_1,schema_id_2,...> comma-separated list of schema IDs to delete
  --dataset <dataset_name> delete schemas from a specific dataset
  --path <path> path to the manifest file if it is not in the default location

Examples
  # Delete single schema
  sanity schema delete --ids <schema_id>

  # Delete multiple schemas
  sanity schema delete --ids <schema_id_1,schema_id_2,...>
`

const deleteSchemaCommand = {
  name: 'delete',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/deleteSchemaAction')

    return mod.default(args as unknown as CliCommandArguments<DeleteSchemaFlags>, context)
  },
} satisfies CliCommandDefinition

export default deleteSchemaCommand
