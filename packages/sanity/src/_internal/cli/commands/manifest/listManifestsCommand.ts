import {type CliCommandDefinition} from '@sanity/cli'

// TODO: Switch to lazy import.
import mod from '../../actions/manifest/listManifestsAction'

const description = 'TODO'

const helpText = `
**Note**: This command is experimental and subject to change.

Examples
  # Lists manifests that have been extracted
  sanity manifest list
`

const listManifestsCommand: CliCommandDefinition = {
  name: 'list',
  group: 'manifest',
  signature: '',
  description,
  helpText,
  action: async (args, context) => {
    // const mod = await import('../../actions/manifest/listManifestsAction')
    //
    // return mod.default(args, context)
    return mod(args, context)
  },
}

export default listManifestsCommand
