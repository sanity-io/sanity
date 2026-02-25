import {BlueprintsInitCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'

export interface BlueprintsInitFlags {
  'example'?: string
  'dir'?: string
  'blueprint-type'?: string
  'type'?: string
  'project-id'?: string
  'projectId'?: string
  'project'?: string
  'stack-id'?: string
  'stackId'?: string
  'stack'?: string
  'stack-name'?: string
  'name'?: string
  'verbose'?: boolean
}

const defaultFlags: BlueprintsInitFlags = {
  //
}

const initBlueprintsCommand: CliCommandDefinition<BlueprintsInitFlags> = {
  name: 'init',
  group: 'blueprints',
  ...transformHelpText(BlueprintsInitCommand, 'sanity', 'blueprints init'),

  async action(args, context) {
    const {apiClient, cliConfig, output} = context
    const flags = {...defaultFlags, ...args.extOptions}

    if (flags.stack) {
      throw new Error('--stack is not supported by init. Use --stack-id instead.')
    }

    const [dir] = args.argsWithoutOptions

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {blueprintInitCore} = await import('@sanity/runtime-cli/cores/blueprints')

    if (flags.example) {
      const conflictingFlags: (keyof BlueprintsInitFlags)[] = [
        'blueprint-type',
        'type',
        'stack-id',
        'stackId',
        'stack-name',
        'name',
      ]
      const foundConflict = conflictingFlags.find((key) => flags[key])
      if (foundConflict) {
        throw new Error(`--example can't be used with --${foundConflict}`)
      }
    }

    const {success, error} = await blueprintInitCore({
      bin: 'sanity',
      log: logger.Logger(output.print, {verbose: flags.verbose}),
      token,
      knownProjectId: cliConfig?.api?.projectId,
      args: {
        dir: dir ?? flags.dir,
      },
      flags: {
        'example': flags.example,
        'blueprint-type': flags['blueprint-type'] ?? flags.type,
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
        'stack-id': flags['stack-id'] ?? flags.stackId,
        'stack-name': flags['stack-name'] ?? flags.name,
        'verbose': flags.verbose,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default initBlueprintsCommand
