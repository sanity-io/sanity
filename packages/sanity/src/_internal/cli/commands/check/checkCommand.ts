import type {CliCommandDefinition} from '@sanity/cli'

const checkCommand: CliCommandDefinition = {
  name: 'check',
  signature: '',
  description: '[deprecated]',
  helpText: '',
  hideFromHelp: true,
  action: (_args, context) => {
    const {output} = context
    output.print('`sanity check` is deprecated and no longer has any effect')
    return Promise.resolve()
  },
}

export default checkCommand
