import {type CliCommandDefinition} from '@sanity/cli'

const helpText = `
Examples
  # Create a new aspect definition file.
  sanity media create-aspect
`

const createAspectCommand: CliCommandDefinition = {
  name: 'create-aspect',
  group: 'media',
  signature: '',
  description: 'Create a new aspect definition file.',
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/media/createAspectAction')
    return mod.default(args, context)
  },
}

export default createAspectCommand
