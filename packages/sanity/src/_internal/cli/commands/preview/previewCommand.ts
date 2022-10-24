import type {CliCommandArguments, CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import type {StartPreviewServerCommandFlags} from '../../actions/preview/previewAction'

const helpText = `
Notes
  Changing the hostname or port number might require a new entry to the CORS-origins allow list.

Options
  --port <port> TCP port to start server on. [default: 3333]
  --host <host> The local network interface at which to listen. [default: "127.0.0.1"]

Examples
  sanity preview --host=0.0.0.0
  sanity preview --port=1942
  sanity preview some/build-output-dir
`

const previewCommand: CliCommandDefinition = {
  name: 'preview',
  signature: '[BUILD_OUTPUT_DIR] [--port <port>] [--host <host>]',
  description: 'Starts a local web server for previewing production build',
  action: async (
    args: CliCommandArguments<StartPreviewServerCommandFlags>,
    context: CliCommandContext
  ) => {
    const previewAction = await getPreviewAction()

    return previewAction(args, context)
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

export default previewCommand
