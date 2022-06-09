import type {CliCommandDefinition} from '@sanity/cli'

const checkCommand: CliCommandDefinition = {
  name: 'check',
  signature: '',
  description: '[deprecated]',
  helpText: '',
  hideFromHelp: true,
  action: async (args, context) => {
    const {output} = context
    await output.print('`sanity check` is deprecated and no longer has any effect')
  },
}

export default checkCommand
