import type {CliCommandDefinition} from '@sanity/cli'

const installCommand: CliCommandDefinition = {
  name: 'install',
  signature: '[PLUGIN]',
  helpText: '',
  description: 'Installs a Sanity plugin to the current Sanity configuration',
  hideFromHelp: true,
  action: async (args, context) => {
    await context.output.error('`sanity install` is no longer supported - use npm/yarn')
  },
}

export default installCommand
