import {FunctionsDevCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'
import open from 'open'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'

export interface FunctionsDevFlags {
  open?: boolean
  host?: string
  h?: string
  port?: number
  p?: number
  timeout?: number
  t?: number
}

const defaultFlags: FunctionsDevFlags = {
  open: false,
  host: 'localhost',
  port: 8080,
}

const devFunctionsCommand: CliCommandDefinition<FunctionsDevFlags> = {
  name: 'dev',
  group: 'functions',
  ...transformHelpText(FunctionsDevCommand, 'sanity', 'functions dev'),
  async action(args, context) {
    const {apiClient, output} = context
    const flags = {...defaultFlags, ...args.extOptions}
    const {open: shouldOpen} = flags

    const client = apiClient({requireUser: true, requireProject: false})
    const {token} = client.config()

    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {initBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {functionDevCore} = await import('@sanity/runtime-cli/cores/functions')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const resolvedHost = flags.h ?? flags.host
    const resolvedPort = flags.p ?? flags.port

    const {success, error} = await functionDevCore({
      ...cmdConfig.value,
      flags: {
        host: resolvedHost,
        port: resolvedPort,
        timeout: flags.t ?? flags.timeout,
      },
    })

    if (!success) throw new Error(error)

    if (shouldOpen) {
      await open(`http://${resolvedHost}:${resolvedPort}`)
    }
  },
}

export default devFunctionsCommand
