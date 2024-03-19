import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Generates types'

const helpText = `
**Note**: This command is experimental and subject to change.

Options
  --help, -h
    Show this help text.

Examples
  # Generate types from a schema, generate schema with "sanity schema extract" first.
  sanity typegen generate

Configuration
The command uses the following configuration properties from sanity-typegen.json:
{
  "path": "'./src/**/*.{ts,tsx,js,jsx}'" // glob pattern to your typescript files
  "schema": "schema.json", // path to your schema file, generated with 'sanity schema extract' command
  "generates": "./sanity.types.ts" // path to the file where the types will be generated
}

The listed properties are the default values, and can be overridden in the configuration file.
`

const generateTypegenCommand: CliCommandDefinition = {
  name: 'generate',
  group: 'typegen',
  signature: '',
  description,
  helpText,
  hideFromHelp: true,
  action: async (args, context) => {
    const mod = await import('../../actions/typegen/generateAction')

    return mod.default(args, context)
  },
} satisfies CliCommandDefinition

export default generateTypegenCommand
