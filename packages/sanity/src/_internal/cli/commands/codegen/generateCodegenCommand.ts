import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Generates codegen'

const helpText = `
Options
  --todo ToDODODOD

Examples
  # does something
  sanity codegen generate
`

const generateCodegenCommand: CliCommandDefinition = {
  name: 'generate',
  group: 'codegen',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/codegen/generateAction')

    return mod.default(args, context)
  },
} satisfies CliCommandDefinition

export default generateCodegenCommand
