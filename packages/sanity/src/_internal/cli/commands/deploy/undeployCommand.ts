import type {CliCommandArguments, CliCommandContext, CliCommandDefinition} from '@sanity/cli'

const helpText = `
Examples
  sanity undeploy
`

const undeployCommand: CliCommandDefinition = {
  name: 'undeploy',
  signature: '',
  description: 'Removes the deployed Sanity Studio from the studio hosting',
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
