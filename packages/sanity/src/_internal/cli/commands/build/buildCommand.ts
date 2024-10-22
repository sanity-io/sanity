import type {CliCommandArguments, CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import {BuildSanityStudioCommandFlags} from '../../actions/build/buildAction'

const helpText = `
Options
  --source-maps Enable source maps for built bundles (increases size of bundle)
  --auto-updates / --no-auto-updates Enable/disable auto updates of studio versions
  --no-minify Skip minifying built JavaScript (speeds up build, increases size of bundle)
  -y, --yes Unattended mode, answers "yes" to any "yes/no" prompt and otherwise uses defaults

Examples
  sanity build
  sanity build --no-minify --source-maps
`

const buildCommand: CliCommandDefinition = {
  name: 'build',
  signature: '[OUTPUT_DIR]',
  description: 'Builds the Sanity Studio configuration into a static bundle',
  action: async (
    args: CliCommandArguments<BuildSanityStudioCommandFlags>,
    context: CliCommandContext,
    overrides?: {basePath?: string},
  ) => {
    const buildAction = await getBuildAction()

    return buildAction(args, context, overrides)
  },
  helpText,
}

async function getBuildAction() {
  // NOTE: in dev-mode we want to include from `src` so we need to use `.ts` extension
  // NOTE: this `if` statement is not included in the output bundle
  if (__DEV__) {
    // eslint-disable-next-line import/extensions
    const mod: typeof import('../../actions/build/buildAction') = require('../../actions/build/buildAction.ts')

    return mod.default
  }

  const mod = await import('../../actions/build/buildAction')

  return mod.default
}

export default buildCommand
