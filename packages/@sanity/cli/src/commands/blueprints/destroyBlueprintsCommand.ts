import {BlueprintsDestroyCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'

export interface BlueprintsDestroyFlags {
  'force'?: boolean
  'f'?: boolean
  'project-id'?: string
  'projectId'?: string
  'project'?: string
  'stack-id'?: string
  'stackId'?: string
  'stack'?: string
  'no-wait'?: boolean
  'verbose'?: boolean
}

const defaultFlags: BlueprintsDestroyFlags = {
  //
}

const destroyBlueprintsCommand: CliCommandDefinition<BlueprintsDestroyFlags> = {
  name: 'destroy',
  group: 'blueprints',
  ...transformHelpText(BlueprintsDestroyCommand, 'sanity', 'blueprints destroy'),

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
    const {blueprintDestroyCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print, {verbose: flags.verbose}),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintDestroyCore({
      ...cmdConfig.value,
      flags: {
        'no-wait': flags['no-wait'],
        'force': flags.force ?? flags.f,
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
        'stack': flags['stack-id'] ?? flags.stackId ?? flags.stack,
        'verbose': flags.verbose,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default destroyBlueprintsCommand
