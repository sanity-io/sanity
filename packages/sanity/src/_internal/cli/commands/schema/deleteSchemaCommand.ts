import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Delete schema documents by id'

const helpText = `
**Note**: This command is experimental and subject to change.

This operation requires a manifest file to exist: use --extract-manifest or run "sanity manifest extract" first.

Options
  --ids <schema_id_1,schema_id_2,...> comma-separated list of schema ids to delete
  --dataset <dataset_name> delete schemas from a specific dataset
  --manifest-dir <directory> directory containing manifest file (default: ./dist/static)
  --extract-manifest regenerates manifest file based on sanity.config; equivalent of running "sanity manifest extract" first

Examples
  # Delete single schema
  sanity schema delete --ids sanity.workspace.schema.workspaceName

  # Delete multiple schemas
  sanity schema delete --ids sanity.workspace.schema.workspaceName,prefix.sanity.workspace.schema.otherWorkspace

  # Ensure manifest file is up-to-date
  sanity schema delete --extract-manifest --ids sanity.workspace.schema.workspaceName

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
