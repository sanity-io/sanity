import {FunctionsLogsCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {createErrorLogger, transformHelpText} from '../../util/runtimeCommandHelp'

export interface FunctionsLogsFlags {
  limit?: number
  l?: number
  json?: boolean
  j?: boolean
  utc?: boolean
  u?: boolean
  delete?: boolean
  d?: boolean
  force?: boolean
  f?: boolean
  watch?: boolean
  w?: boolean
}

const defaultFlags = {
  limit: 50,
  json: false,
  utc: false,
  delete: false,
  force: false,
  watch: false,
}

const transformedHelp = transformHelpText(FunctionsLogsCommand, 'sanity', 'functions logs')

const logsFunctionsCommand: CliCommandDefinition<FunctionsLogsFlags> = {
  name: 'logs',
  group: 'functions',
  ...transformedHelp,
  async action(args, context) {
    const {apiClient, output} = context
    const [name] = args.argsWithoutOptions
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    if (!name) {
      throw new Error('You must provide a function name as the first argument')
    }

    const token = client.config().token
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {initDeployedBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {functionLogsCore} = await import('@sanity/runtime-cli/cores/functions')

    const cmdConfig = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await functionLogsCore({
      ...cmdConfig.value,
      helpText: transformedHelp.helpText,
      error: createErrorLogger(output),
      args: {name},
      flags: {
        limit: flags.l ?? flags.limit,
        json: flags.j ?? flags.json,
        utc: flags.u ?? flags.utc,
        delete: flags.d ?? flags.delete,
        force: flags.f ?? flags.force,
        watch: flags.w ?? flags.watch,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default logsFunctionsCommand
