import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
} from '@sanity/cli'

const helpText = `
Examples
  sanity undeploy
`

const undeployCommand: CliCommandDefinition = {
  name: 'undeploy',
  signature: '',
  description: 'Removes the deployed Sanity Studio from Sanity hosting',
  action: async (
    args: CliCommandArguments<Record<string, unknown>>,
    context: CliCommandContext,
  ) => {
    const mod = await import('../../actions/deploy/undeployAction')

    return mod.default(args, context)
  },
  helpText,
}

export default undeployCommand
