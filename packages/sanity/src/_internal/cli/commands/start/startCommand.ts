import type {CliCommandArguments, CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import type {StartDevServerCommandFlags} from '../../actions/start/startAction'

const helpText = `
Notes
  Changing the hostname or port number might require a new CORS-entry to be added.

Options
  --port <port> TCP port to start server on. [default: 3333]
  --host <host> The local network interface at which to listen. [default: "127.0.0.1"]

Examples
  sanity start --host=0.0.0.0
  sanity start --port=1942
`

const startCommand: CliCommandDefinition = {
  name: 'start',
  signature: '[--port <port>] [--host <host>]',
  description: 'Starts a web server for the Sanity Studio',
  action: async (
    args: CliCommandArguments<StartDevServerCommandFlags>,
    context: CliCommandContext
  ) => {
    const startAction = await getStartAction()

    return startAction(args, context)
  },
  helpText,
}

async function getStartAction() {
  // NOTE: in dev-mode we want to include from `src` so we need to use `.ts` extension
  // NOTE: this `if` statement is not included in the output bundle
  if (__DEV__) {
    // eslint-disable-next-line import/extensions
    const mod: typeof import('../../actions/start/startAction') = require('../../actions/start/startAction.ts')

    return mod.default
  }

  const mod = await import('../../actions/start/startAction')

  return mod.default
}

export default startCommand
