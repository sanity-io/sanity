import {BlueprintsLogsCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'

export interface BlueprintsLogsFlags {
  watch?: boolean
  w?: boolean
  stack?: string
}

const defaultFlags: BlueprintsLogsFlags = {
  //
}

const logsBlueprintsCommand: CliCommandDefinition<BlueprintsLogsFlags> = {
  name: 'logs',
  group: 'blueprints',
  ...transformHelpText(BlueprintsLogsCommand, 'sanity', 'blueprints logs'),

  async action(args, context) {
    const {apiClient, output} = context
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {initDeployedBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {blueprintLogsCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print),
      stackOverride: flags.stack,
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, streaming, error} = await blueprintLogsCore({
      ...cmdConfig.value,
      flags: {
        watch: flags.watch ?? flags.w,
      },
    })

    if (streaming) await streaming

    if (!success) throw new Error(error)
  },
}

export default logsBlueprintsCommand
