import {BlueprintsDoctorCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'

export interface BlueprintsDoctorFlags {
  path?: string
  fix?: boolean
  json?: boolean
  verbose?: boolean
}

const defaultFlags: BlueprintsDoctorFlags = {
  fix: false,
  json: false,
  verbose: false,
}

const doctorBlueprintsCommand: CliCommandDefinition<BlueprintsDoctorFlags> = {
  name: 'doctor',
  group: 'blueprints',
  ...transformHelpText(BlueprintsDoctorCommand, 'sanity', 'blueprints doctor'),

  async action(args, context) {
    const {apiClient, output} = context
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {blueprintDoctorCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const {success, error} = await blueprintDoctorCore({
      bin: 'sanity',
      log: logger.Logger(output.print, {verbose: flags.verbose}),
      token,
      flags,
    })

    if (!success) throw new Error(error)
  },
}

export default doctorBlueprintsCommand
