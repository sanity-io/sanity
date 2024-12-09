import {type CliCommandDefinition} from '@sanity/cli'

const description = 'Extracts the studio configuration as one or more JSON manifest files.'

const helpText = `
**Note**: This command is experimental and subject to change. It is currently intended for use with Create only.

Options
  --path Optional path to specify destination directory of the manifest files. Default: /dist/static

Examples
  # Extracts manifests
  sanity manifest extract

  # Extracts manifests into /public/static
  sanity manifest extract --path /public/static
`

const extractManifestCommand: CliCommandDefinition = {
  name: 'extract',
  group: 'manifest',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    const {extractManifestSafe} = await import('../../actions/manifest/extractManifestAction')
    const extractError = await extractManifestSafe(args, context)
    if (extractError) {
      throw extractError
    }
    return extractError
  },
}

export default extractManifestCommand
