import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Extracts a json representation of a sanity schema within a Studio context.'

const helpText = `
Options
  --workspace <name> The name of the workspace to generate a schema for
  --path Optional path to specify destination of the schema file

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
