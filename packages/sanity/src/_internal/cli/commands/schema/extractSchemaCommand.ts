import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Extracts a JSON representation of a Sanity schema within a Studio context.'

const helpText = `
**Note**: This command is experimental and subject to change.

Options
  --workspace <name> The name of the workspace to generate a schema for
  --path Optional path to specify destination of the schema file
  --enforce-required-fields Makes the schema generated treat fields marked as required as non-optional. Defaults to false.
  --format=[groq-type-nodes] Format the schema as GROQ type nodes. Only available format at the moment.

Examples
  # Extracts schema types in a Sanity project with more than one workspace
  sanity schema extract --workspace default
`

const extractSchemaCommand: CliCommandDefinition = {
  name: 'extract',
  group: 'schema',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/schema/extractAction')

    return mod.default(args, context)
  },
} satisfies CliCommandDefinition

export default extractSchemaCommand
