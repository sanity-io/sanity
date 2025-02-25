import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
} from '@sanity/cli'

const helpText = `
Examples
  sanity app undeploy
`

const appUndeployCommand: CliCommandDefinition = {
  name: 'undeploy',
  group: 'app',
  signature: '',
  description: 'Removes the deployed Core application from Sanity hosting',
  action: async (
    args: CliCommandArguments<Record<string, unknown>>,
    context: CliCommandContext,
  ) => {
    const mod = await import('../../actions/app/undeployAction')

    return mod.default(args, context)
  },
  helpText,
}

export default appUndeployCommand
