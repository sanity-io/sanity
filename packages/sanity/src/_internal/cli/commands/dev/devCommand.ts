import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
} from '@sanity/cli'

import {type StartDevServerCommandFlags} from '../../actions/dev/devAction'
import {determineIsApp} from '../../util/determineIsApp'

// TODO: Add this once we are ready to release it.
// --load-in-dashboard <boolean> Load the dev server in the Sanity dashboard. [default: false]

const helpText = `
Notes
  Changing the hostname or port number might require a new entry to the CORS-origins allow list.

Options
  --port <port> TCP port to start server on. [default: 3333]
  --host <host> The local network interface at which to listen. [default: "127.0.0.1"]

Examples
  sanity dev --host=0.0.0.0
  sanity dev --port=1942
`

const devCommand: CliCommandDefinition = {
  name: 'dev',
  signature: '[--port <port>] [--host <host>]',
  description: 'Starts a local dev server for Sanity Studio with live reloading',
  action: async (
    args: CliCommandArguments<StartDevServerCommandFlags>,
    context: CliCommandContext,
  ) => {
    const devAction = await getDevAction(context)

    return devAction(args, context)
  },
  helpText,
}

export async function getDevAction(
  context: CliCommandContext,
): Promise<
  (
    args: CliCommandArguments<StartDevServerCommandFlags>,
    context: CliCommandContext,
  ) => Promise<void>
> {
  const isApp = determineIsApp(context.cliConfig)

  // NOTE: in dev-mode we want to include from `src` so we need to use `.ts` extension
  if (__DEV__) {
    if (isApp) {
      // eslint-disable-next-line import/extensions,@typescript-eslint/consistent-type-imports
      const mod = require('../../actions/app/devAction.ts')
      return mod.default
    }
    // eslint-disable-next-line import/extensions,@typescript-eslint/consistent-type-imports
    const mod = require('../../actions/dev/devAction.ts')
    return mod.default
  }
  if (isApp) {
    const mod = await import('../../actions/app/devAction')
    return mod.default
  }
  const mod = await import('../../actions/dev/devAction')
  return mod.default
}

export default devCommand
