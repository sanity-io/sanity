import {BlueprintsDeployCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'

export interface BlueprintsDeployFlags {
  'no-wait'?: boolean
  'stack'?: string
}

const defaultFlags: BlueprintsDeployFlags = {
  //
}

const deployBlueprintsCommand: CliCommandDefinition<BlueprintsDeployFlags> = {
  name: 'deploy',
  group: 'blueprints',
  ...transformHelpText(BlueprintsDeployCommand, 'sanity', 'blueprints deploy'),

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
    const {blueprintDeployCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print),
      stackOverride: flags.stack,
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintDeployCore({
      ...cmdConfig.value,
      flags: {
        'no-wait': flags['no-wait'],
      },
    })

    if (!success) throw new Error(error)
  },
}

export default deployBlueprintsCommand
