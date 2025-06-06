import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
} from '@sanity/cli'

import {type DeployStudioActionFlags} from '../../actions/deploy/deployAction'
import {determineIsApp} from '../../util/determineIsApp'

const helpText = `
Options
  --source-maps Enable source maps for built bundles (increases size of bundle)
  --no-minify Skip minifying built JavaScript (speeds up build, increases size of bundle)
  --no-build Don't build the studio prior to deploy, instead deploying the version currently in \`dist/\`
  --schema-required Fail-fast deployment if schema store fails
  --verbose Enable verbose logging
  -y, --yes Unattended mode, answers "yes" to any "yes/no" prompt and otherwise uses defaults

Examples
  # Build the studio
  sanity deploy

  # Deploys non-minified build with source maps
  sanity deploy --no-minify --source-maps

  # Fail fast on schema store fails – for when other services rely on the stored schema
  sanity deploy --schema-required`

const deployCommand: CliCommandDefinition = {
  name: 'deploy',
  signature: '[SOURCE_DIR] [--no-build] [--source-maps] [--no-minify]',
  description: 'Builds and deploys Sanity Studio or application to Sanity hosting',
  action: async (
    args: CliCommandArguments<DeployStudioActionFlags>,
    context: CliCommandContext,
  ) => {
    let mod: {
      default: (
        args: CliCommandArguments<DeployStudioActionFlags>,
        context: CliCommandContext,
      ) => Promise<void>
    }

    const isApp = determineIsApp(context.cliConfig)

    if (isApp) {
      mod = await import('../../actions/app/deployAction')
    } else {
      mod = await import('../../actions/deploy/deployAction')
    }

    return mod.default(args, context)
  },
  helpText,
}

export default deployCommand
