import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
} from '@sanity/cli'

import {type StartPreviewServerCommandFlags} from '../../actions/preview/previewAction'
import {isInteractive} from '../../util/isInteractive'
import {getDevAction} from '../dev/devCommand'

const helpText = `
Notes
  Changing the hostname or port number might require a new CORS-entry to be added.

Options
  --port <port> TCP port to start server on. [default: 3333]
  --host <host> The local network interface at which to listen. [default: "127.0.0.1"]

Examples
  sanity app start --host=0.0.0.0
  sanity app start --port=1942
  sanity app start some/build-output-dir
`

const appStartCommand: CliCommandDefinition = {
  name: 'start',
  group: 'app',
  signature: '[BUILD_OUTPUT_DIR] [--port <port>] [--host <host>]',
  description: 'Previews a built Sanity application',
  action: async (
    args: CliCommandArguments<StartPreviewServerCommandFlags>,
    context: CliCommandContext,
  ) => {
    const {output, chalk, prompt} = context
    const previewAction = await getPreviewAction()

    const error = (msg: string) => output.warn(chalk.red.bgBlack(msg))

    try {
      await previewAction(args, context)
    } catch (err) {
      if (err.name !== 'BUILD_NOT_FOUND') {
        throw err
      }

      error(err.message)
      error('\n')

      const shouldRunDevServer =
        isInteractive &&
        (await prompt.single({
          message: 'Do you want to start a development server instead?',
          type: 'confirm',
        }))

      if (shouldRunDevServer) {
        const devAction = await getDevAction()
        await devAction(args, context)
      } else {
        // Indicate that this isn't an expected exit
        // eslint-disable-next-line no-process-exit
        process.exit(1)
      }
    }
  },
  helpText,
}

async function getPreviewAction() {
  // NOTE: in dev-mode we want to include from `src` so we need to use `.ts` extension
  // NOTE: this `if` statement is not included in the output bundle
  if (__DEV__) {
    // eslint-disable-next-line import/extensions,@typescript-eslint/consistent-type-imports
    const mod: typeof import('../../actions/preview/previewAction') = require('../../actions/preview/previewAction.ts')

    return mod.default
  }

  const mod = await import('../../actions/preview/previewAction')

  return mod.default
}

export default appStartCommand
