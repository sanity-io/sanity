import {type CliCommandDefinition} from '../../types'

const description = 'Generates TypeScript types from schema types and GROQ queries'

const helpText = `
Sanity TypeGen (Beta)
This command is currently in beta and may undergo significant changes. Feedback is welcome!

Usage
  sanity typegen generate [options]

Options:
  --config-path <path>
    Specifies the path to the typegen configuration file. This file should be a JSON file that contains settings for the type generation process.
    Default: "sanity-typegen.json"

  --help, -h
    Displays this help message, providing information on command usage and options.

Examples:
  Generate TypeScript type definitions from a Sanity Studio schema extracted using the \`sanity schema extract\` command.
    $ sanity typegen generate

Configuration:
This command can utilize configuration settings defined in a \`sanity-typegen.json\` file. These settings include:

- "path": Specifies a glob pattern to locate your TypeScript or JavaScript files.
  Default: "./src/**/*.{ts,tsx,js,jsx}"

- "schema": Defines the path to your Sanity schema file. This file should be generated using the \`sanity schema extract\` command.
  Default: "schema.json"

- "generates": Indicates the path where the generated TypeScript type definitions will be saved.
  Default: "./sanity.types.ts"

The default configuration values listed above are used if not overridden in your \`sanity-typegen.json\` configuration file. To customize the behavior of the type generation, adjust these properties in the configuration file according to your project's needs.

Note:
- The \`sanity schema extract\` command is a prerequisite for extracting your Sanity Studio schema into a \`schema.json\` file, which is then used by the \`sanity typegen generate\` command to generate type definitions.
- While this tool is in beta, we encourage you to experiment with these configurations and provide feedback to help improve its functionality and usability.
`

const generateTypegenCommand: CliCommandDefinition = {
  name: 'generate',
  group: 'typegen',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/typegen/generateAction')

    return mod.default(args, context)
  },
} satisfies CliCommandDefinition

export default generateTypegenCommand
