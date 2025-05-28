import {type CliCommandDefinition} from '@sanity/cli'

const helpText = `
Options
  --media-library-id The id of the target media library.

Examples
  # Export all assets and aspects.
  sanity media export
`

interface MediaFlags {
  'media-library-id'?: string
}

const exportMediaCommand: CliCommandDefinition<MediaFlags> = {
  name: 'export',
  group: 'media',
  signature: '[FILE]',
  description: 'Export an archive of all assets and aspect data from the target media library.',
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/media/exportAssetsAction')
    return mod.default(args, context)
  },
}

export default exportMediaCommand
