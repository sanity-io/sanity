import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
} from '@sanity/cli'

import {type StartDevServerCommandFlags} from '../../actions/dev/devAction'

const helpText = `
Notes
  Changing the hostname or port number might require a new entry to the CORS-origins allow list.

Options
  --port <port> TCP port to start server on. [default: 3334]
  --host <host> The local network interface at which to listen. [default: "127.0.0.1"]

Examples
  sanity app dev --host=0.0.0.0
  sanity app dev --port=1942
`

const appDevCommand: CliCommandDefinition = {
  name: 'dev',
  group: 'app',
  signature: '[--port <port>] [--host <host>]',
  description: 'Starts a local dev server for your Sanity application with live reloading',
  action: async (
    args: CliCommandArguments<StartDevServerCommandFlags>,
    context: CliCommandContext,
  ) => {
    const devAction = await getDevAction()

    return devAction(args, context)
  },
  helpText,
}

export async function getDevAction(): Promise<
  (
    args: CliCommandArguments<StartDevServerCommandFlags>,
    context: CliCommandContext,
  ) => Promise<void>
> {
  // NOTE: in dev-mode we want to include from `src` so we need to use `.ts` extension
  // NOTE: this `if` statement is not included in the output bundle
  if (__DEV__) {
    // eslint-disable-next-line import/extensions,@typescript-eslint/consistent-type-imports
    const mod: typeof import('../../actions/app/devAction') = require('../../actions/app/devAction.ts')

    return mod.default
  }

  const mod = await import('../../actions/app/devAction')

  return mod.default
}

export default appDevCommand
