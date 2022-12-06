import type {CliCommandArguments, CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import type {StartPreviewServerCommandFlags} from '../../actions/preview/previewAction'
import {getDevAction} from '../dev/devCommand'

const helpText = `
Notes
  Changing the hostname or port number might require a new CORS-entry to be added.

Options
  --port <port> TCP port to start server on. [default: 3333]
  --host <host> The local network interface at which to listen. [default: "127.0.0.1"]

Examples
  sanity start --host=0.0.0.0
  sanity start --port=1942
  sanity start some/build-output-dir
`

const startCommand: CliCommandDefinition = {
  name: 'start',
  signature: '[BUILD_OUTPUT_DIR] [--port <port>] [--host <host>]',
  description: 'Alias of `sanity preview`',
  action: async (
    args: CliCommandArguments<StartPreviewServerCommandFlags>,
    context: CliCommandContext
  ) => {
    const {output, chalk, prompt} = context
    const previewAction = await getPreviewAction()

    const warn = (msg: string) => output.warn(chalk.yellow.bgBlack(msg))
    const error = (msg: string) => output.warn(chalk.red.bgBlack(msg))
    warn('╔═══════════════════════════════════════════════════════════════════════════╗')
    warn("║ \u26A0  IMPORTANT: You're running Sanity Studio v3, and in this version        ║")
    warn('║    the [start] command is used to preview static builds. To               ║')
    warn('║    run a development server, use the [npm run dev] command instead.       ║')
    warn('║                                                                           ║')
    warn('║    For more information go to https://www.sanity.io/help/studio-v2-vs-v3  ║')
    warn('╚═══════════════════════════════════════════════════════════════════════════╝')
    warn('') // Newline to separate from other output

    return previewAction(args, context).catch(async (err) => {
      if (err.name === 'BUILD_NOT_FOUND') {
        error(err.message)
        error('\n')
        const runDevServerResponse = await prompt.single({
          message: 'Did you intend to run [npm run dev] to start a development server instead?',
          type: 'confirm',
        })
        if (runDevServerResponse) {
          const devAction = await getDevAction()
          await devAction(args, context)
        }
        return
      }
      throw err
    })
  },
  helpText,
}

async function getPreviewAction() {
  // NOTE: in dev-mode we want to include from `src` so we need to use `.ts` extension
  // NOTE: this `if` statement is not included in the output bundle
  if (__DEV__) {
    // eslint-disable-next-line import/extensions
    const mod: typeof import('../../actions/preview/previewAction') = require('../../actions/preview/previewAction.ts')

    return mod.default
  }

  const mod = await import('../../actions/preview/previewAction')

  return mod.default
}

export default startCommand
