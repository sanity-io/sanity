import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Delete schema documents by id.'

const helpText = `
**Note**: This command is experimental and subject to change.

This operation (re-)generates a manifest file describing the sanity config workspace by default.
To re-use an existing manifest file, use --no-extract-manifest.

Options
  --ids <schema_id_1,schema_id_2,...> comma-separated list of schema ids to delete
  --dataset <dataset_name> delete schemas from a specific dataset
  --manifest-dir <directory> directory containing manifest file (default: ./dist/static)
  --no-extract-manifest disables manifest generation – the command will fail if no manifest exists

Examples
  # Delete single schema
  sanity schema delete --ids sanity.workspace.schema.workspaceName

  # Delete multiple schemas
  sanity schema delete --ids sanity.workspace.schema.workspaceName,prefix.sanity.workspace.schema.otherWorkspace

  # Runs using a pre-existing manifest file
  # Config changes in sanity.config will not be picked up in this case
  sanity schema delete --no-extract-manifest --ids sanity.workspace.schema.workspaceName

`

const deleteSchemaCommand = {
  name: 'delete',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/deleteSchemaAction')
    const result = await mod.default(args.extOptions, context)
    if (result === 'failure') process.exit(1)
    return result
  },
} satisfies CliCommandDefinition

export default deleteSchemaCommand
