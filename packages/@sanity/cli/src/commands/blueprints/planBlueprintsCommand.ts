import {BlueprintsPlanCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'

export interface BlueprintsPlanFlags {
  verbose?: boolean
  stack?: string
}

const defaultFlags: BlueprintsPlanFlags = {
  //
}

const planBlueprintsCommand: CliCommandDefinition<BlueprintsPlanFlags> = {
  name: 'plan',
  group: 'blueprints',
  ...transformHelpText(BlueprintsPlanCommand, 'sanity', 'blueprints plan'),

  async action(args, context) {
    const {apiClient, output} = context
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {initBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {blueprintPlanCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print, {verbose: flags.verbose}),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintPlanCore({
      ...cmdConfig.value,
      flags: {
        verbose: flags.verbose,
        stack: flags.stack,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default planBlueprintsCommand
