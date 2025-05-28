import {type CliCommandDefinition} from '@sanity/cli'

const helpText = `
Options
  --media-library-id The id of the target media library.

Examples
  # Delete the aspect named "someAspect".
  sanity media delete-aspect someAspect
`

const deleteAspectCommand: CliCommandDefinition = {
  name: 'delete-aspect',
  group: 'media',
  signature: '[ASPECT_NAME]',
  description: 'Undeploy an aspect.',
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/media/deleteAspectAction')
    return mod.default(args, context)
  },
}

export default deleteAspectCommand
