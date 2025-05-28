import open from 'open'

import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --port <port> Port to start emulator on

Examples
  # Start dev server on default port
  sanity functions dev

  # Start dev server on specific port
  sanity functions dev --port 3333
`

export interface FunctionsDevFlags {
  port?: number
}

const defaultFlags: FunctionsDevFlags = {
  port: 8080,
}

const devFunctionsCommand: CliCommandDefinition<FunctionsDevFlags> = {
  name: 'dev',
  group: 'functions',
  helpText,
  signature: '[--port <port>]',
  description: 'Start the Sanity Function emulator',
  async action(args, context) {
    const {apiClient, output} = context
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({requireUser: true, requireProject: false})
    const {token} = client.config()

    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {initBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {functionDevCore} = await import('@sanity/runtime-cli/cores/functions')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await functionDevCore({
      ...cmdConfig.value,
      flags: {
        port: flags.port,
      },
    })

    if (!success) throw new Error(error)

    open(`http://localhost:${flags.port}`)
  },
}

export default devFunctionsCommand
