import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --verbose  Provide detailed information about issues

Examples:
  # Check the health of the current Blueprint project
  sanity blueprints doctor --verbose
`

export interface BlueprintsDoctorFlags {
  // path?: string // not supported yet
  verbose?: boolean
}

const defaultFlags: BlueprintsDoctorFlags = {
  verbose: false,
}

const doctorBlueprintsCommand: CliCommandDefinition<BlueprintsDoctorFlags> = {
  name: 'doctor',
  group: 'blueprints',
  helpText,
  signature: '[--verbose]',
  description: 'Diagnose potential issues with Blueprint configuration',

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
      log: (message) => output.print(message),
      token,
      flags,
    })

    if (!success) throw new Error(error)
  },
}

export default doctorBlueprintsCommand
