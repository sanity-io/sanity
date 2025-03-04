import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
} from '@sanity/cli'

import {type UndeployStudioActionFlags} from '../../actions/deploy/undeployAction'

const helpText = `
Options
  -y, --yes Unattended mode, answers "yes" to any "yes/no" prompt and otherwise uses defaults

Examples
  sanity undeploy
  sanity undeploy --yes
`

const undeployCommand: CliCommandDefinition = {
  name: 'undeploy',
  signature: '',
  description: 'Removes the deployed Sanity Studio from Sanity hosting',
  action: async (
    args: CliCommandArguments<UndeployStudioActionFlags>,
    context: CliCommandContext,
  ) => {
    const mod = await import('../../actions/deploy/undeployAction')

    return mod.default(args, context)
  },
  helpText,
}

export default undeployCommand
