import {type CliCommandDefinition} from '@sanity/cli'

const helpText = `
Options
  --media-library-id The id of the target media library.
  --all              Deploy all aspects.

Examples
  # Deploy the aspect named "someAspect".
  sanity media deploy-aspect someAspect

  # Deploy all aspects.
  sanity media deploy-aspect --all
`

const deployAspectCommand: CliCommandDefinition = {
  name: 'deploy-aspect',
  group: 'media',
  signature: '[ASPECT_NAME]',
  description: 'Deploy an aspect.',
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/media/deployAspectAction')
    return mod.default(args, context)
  },
}

export default deployAspectCommand
