import {type CliCommandDefinition} from '@sanity/cli'

// TODO: Switch to lazy import.
import mod from '../../actions/manifest/extractManifestAction'

const description = 'Extracts a JSON representation of a Sanity schema within a Studio context.'

const helpText = `
**Note**: This command is experimental and subject to change.

Examples
  # Extracts manifests
  sanity manifest extract
`

const extractManifestCommand: CliCommandDefinition = {
  name: 'extract',
  group: 'manifest',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    // const mod = await import('../../actions/manifest/extractManifestAction')
    //
    // return mod.default(args, context)
    return mod(args, context)
  },
}

export default extractManifestCommand
