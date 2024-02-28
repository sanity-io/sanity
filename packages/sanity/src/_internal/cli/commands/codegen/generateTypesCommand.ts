import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Generates codegen'

const helpText = `
**Note**: This command is experimental and subject to change.

Options
  --help, -h
    Show this help text.

Examples
  # Generate types from a schema, generate schema with "sanity schema extract" first.
  sanity codegen generate-types

Configuration
The codegen command uses the following configuration properties from sanity-codegen.json:
{
  "path": "'./src/**/*.{ts,tsx,js,jsx}'" // glob pattern to your typescript files
  "schema": "schema.json", // path to your schema file, generated with 'sanity schema extract' command
  "generates": "./groq-types.ts" // path to the file where the types will be generated
}

The listed properties are the default values, and can be overridden in the configuration file.
`

const generateTypesCodegenCommand: CliCommandDefinition = {
  name: 'generate-types',
  group: 'codegen',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/codegen/generateTypesAction')

    return mod.default(args, context)
  },
} satisfies CliCommandDefinition

export default generateTypesCodegenCommand
