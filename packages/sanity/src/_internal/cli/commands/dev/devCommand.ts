import path from 'node:path'

import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
  type CliConfig,
} from '@sanity/cli'

import {type StartDevServerCommandFlags} from '../../actions/dev/devAction'
import {startDevServer} from '../../server'

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
    const {workDir, cliConfig} = context

    // if not studio app, skip all Studio-specific initialization
    if (!(cliConfig && 'isStudioApp' in cliConfig)) {
      // non-studio apps were not possible in v2
      const config = cliConfig as CliConfig | undefined
      return startDevServer({
        cwd: workDir,
        basePath: '/',
        staticPath: path.join(workDir, 'static'),
        httpPort: Number(args.extOptions?.port) || 3333,
        httpHost: args.extOptions?.host,
        reactStrictMode: true,
        reactCompiler: config?.reactCompiler,
        vite: config?.vite,
        isStudioApp: false,
      })
    }
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
    const mod: typeof import('../../actions/dev/devAction') = require('../../actions/dev/devAction.ts')

    return mod.default
  }

  const mod = await import('../../actions/dev/devAction')

  return mod.default
}

export default devCommand
