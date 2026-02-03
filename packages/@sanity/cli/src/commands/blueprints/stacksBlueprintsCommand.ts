import {BlueprintsStacksCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'

export interface BlueprintsStacksFlags {
  'project-id'?: string
  'projectId'?: string
  'project'?: string
  'verbose'?: boolean
}

const defaultFlags: BlueprintsStacksFlags = {
  //
}

const stacksBlueprintsCommand: CliCommandDefinition<BlueprintsStacksFlags> = {
  name: 'stacks',
  group: 'blueprints',
  ...transformHelpText(BlueprintsStacksCommand, 'sanity', 'blueprints stacks'),
  hideFromHelp: false,

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
    const {blueprintStacksCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print, {verbose: flags.verbose}),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintStacksCore({
      ...cmdConfig.value,
      flags: {
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
        'verbose': flags.verbose,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default stacksBlueprintsCommand
