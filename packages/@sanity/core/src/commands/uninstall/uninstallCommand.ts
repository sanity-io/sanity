import type {CliCommandDefinition} from '@sanity/cli'

const uninstallCommand: CliCommandDefinition = {
  name: 'uninstall',
  signature: '[plugin]',
  helpText: '',
  description: 'Removes a Sanity plugin from the current Sanity configuration',
  hideFromHelp: true,
  action: async (args, context) => {
    await context.output.error('`sanity uninstall` is no longer supported - use npm/yarn')
  },
}

export default uninstallCommand
