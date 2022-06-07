import type {CliCommandDefinition} from '@sanity/cli'

const configCheckCommand: CliCommandDefinition = {
  name: 'configcheck',
  signature: '',
  description: 'Checks if the required configuration files for plugins exists and are up to date',
  helpText: '',
  hideFromHelp: true,
  action: async (args, context) => {
    await context.output.error('`sanity configcheck` is no longer required/used')
  },
}

export default configCheckCommand
