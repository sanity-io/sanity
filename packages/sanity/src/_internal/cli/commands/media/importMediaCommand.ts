import {type CliCommandDefinition} from '@sanity/cli'

const helpText = `
Options
  --media-library-id The id of the target media library.
  --replace-aspects  Replace existing aspect data. All versions will be replaced (e.g. published and draft aspect data).

Examples
  # Import all assets from the "products" directory.
  sanity media import products

  # Import all assets from "gallery" archive.
  sanity media import gallery.tar.gz

  # Import all assets from the "products" directory and replace aspects.
  sanity media import products --replace-aspects
`

interface MediaFlags {
  'media-library-id'?: string
}

const importMediaCommand: CliCommandDefinition<MediaFlags> = {
  name: 'import',
  group: 'media',
  signature: '[FILE | FOLDER]',
  description: 'Import a set of assets to the target media library.',
  helpText,
  action: async (args, context) => {
    const mod = await import('../../actions/media/importAssetsAction')
    return mod.default(args, context)
  },
}

export default importMediaCommand
