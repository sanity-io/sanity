import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
} from '@sanity/cli'

import {type DeployStudioActionFlags} from '../../actions/deploy/deployAction'

const helpText = `
Options
  --source-maps Enable source maps for built bundles (increases size of bundle)
  --no-minify Skip minifying built JavaScript (speeds up build, increases size of bundle)
  --no-build Don't build the application prior to deploy, instead deploying the version currently in \`dist/\`
  -y, --yes Unattended mode, answers "yes" to any "yes/no" prompt and otherwise uses defaults

Examples
  sanity deploy
  sanity deploy --no-minify --source-maps
`

const appDeployCommand: CliCommandDefinition = {
  name: 'deploy',
  group: 'app',
  signature: '[SOURCE_DIR] [--no-build] [--source-maps] [--no-minify]',
  description: 'Builds and deploys Sanity application to Sanity hosting',
  action: async (
    args: CliCommandArguments<DeployStudioActionFlags>,
    context: CliCommandContext,
  ) => {
    const mod = await import('../../actions/deploy/deployAction')

    return mod.default(args, context)
  },
  helpText,
}

export default appDeployCommand
