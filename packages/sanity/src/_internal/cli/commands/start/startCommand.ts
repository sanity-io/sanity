import type {CliCommandArguments, CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import type {StartPreviewServerCommandFlags} from '../../actions/preview/previewAction'

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
    const {output, chalk} = context
    const previewAction = await getPreviewAction()

    try {
      await previewAction(args, context)
      return
    } catch (err) {
      if (err.name !== 'BUILD_NOT_FOUND') {
        throw err
      }

      // `sanity dev` used to be `sanity start` in v2. To ease transition for existing users,
      // hint that they might want to use `sanity dev` instead if we fail to find a build.
      const warn = (msg: string) => output.warn(`${chalk.yellow.bgBlack('[warn]')} ${msg}`)
      warn(`\`sanity start\` is now an alias of \`sanity preview\``)
      warn(`and is used to preview a production build of the Sanity Studio.`)
      warn(`Use \`sanity dev\` to start a development server.`)
      output.warn('') // Newline to separate from error below

      throw err
    }
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
