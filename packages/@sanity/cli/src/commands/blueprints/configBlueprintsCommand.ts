import {BlueprintsConfigCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'

export interface BlueprintsConfigFlags {
  'edit'?: boolean
  'e'?: boolean
  'project-id'?: string
  'projectId'?: string
  'project'?: string
  'stack-id'?: string
  'stackId'?: string
  'stack'?: string
  'verbose'?: boolean
}

const defaultFlags: BlueprintsConfigFlags = {
  //
}

const configBlueprintsCommand: CliCommandDefinition<BlueprintsConfigFlags> = {
  name: 'config',
  group: 'blueprints',
  ...transformHelpText(BlueprintsConfigCommand, 'sanity', 'blueprints config'),

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
    const {blueprintConfigCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print, {verbose: flags.verbose}),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintConfigCore({
      ...cmdConfig.value,
      token,
      flags: {
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
        'stack': flags['stack-id'] ?? flags.stackId ?? flags.stack,
        'edit': flags.edit ?? flags.e,
        'verbose': flags.verbose,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default configBlueprintsCommand
