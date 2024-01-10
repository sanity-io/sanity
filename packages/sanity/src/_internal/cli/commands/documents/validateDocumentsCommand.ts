import type {CliCommandDefinition} from '@sanity/cli'

const helpText = `
Options
  # TODO

Examples
  # Run the script at some/script.js in Sanity context
  sanity documents validate
`

const validateDocumentsCommand: CliCommandDefinition = {
  name: 'validate',
  group: 'documents',
  signature: '',
  description: 'Validates all document specified in a workspace.',
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/validation/validateAction')

    return mod.default(args, context)
  },
} satisfies CliCommandDefinition

export default validateDocumentsCommand
