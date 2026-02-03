import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'
import {BlueprintsInfoCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

export interface BlueprintsInfoFlags {
  id?: string
}

const defaultFlags: BlueprintsInfoFlags = {
  //
}

const infoBlueprintsCommand: CliCommandDefinition<BlueprintsInfoFlags> = {
  name: 'info',
  group: 'blueprints',
  ...transformHelpText(BlueprintsInfoCommand, 'sanity', 'blueprints info'),

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
    const {blueprintInfoCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintInfoCore({
      ...cmdConfig.value,
      flags,
    })

    if (!success) throw new Error(error)
  },
}

export default infoBlueprintsCommand
