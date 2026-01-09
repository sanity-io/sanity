import {type CliCommandDefinition} from '../../types'

const helpText = `
Arguments
  [dir]  Path to initialize the Blueprint in

Options
  --blueprint-type, --type <json>    Blueprint manifest type to use for the Blueprint (json|js|ts)
  --project-id <id>                  Sanity Project ID to use for the Blueprint
  --stack-id <id>                    Existing Stack ID to use for the Blueprint
  --stack-name <id>                  Name to use for a NEW Stack
  --verbose                          Verbose output

Examples:
  # Create a new Blueprint project in the current directory
  sanity blueprints init

  # Create a new Blueprint project in a specific directory
  sanity blueprints init my-sanity-project --type json

  # Create a new Blueprint project in a specific directory with an example
  sanity blueprints init --example example-name
`

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
  helpText,
  signature: '[dir] [--blueprint-type <type>] [--project-id <id>]',
  description: 'Initialize a new Blueprint',

  async action(args, context) {
    const {apiClient, output} = context
    const flags = {...defaultFlags, ...args.extOptions}

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
        'stack',
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
      log: (message) => output.print(message),
      token,
      args: {
        dir: dir ?? flags.dir,
      },
      flags: {
        'example': flags.example,
        'blueprint-type': flags['blueprint-type'] ?? flags.type,
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
        'stack-id': flags['stack-id'] ?? flags.stackId ?? flags.stack,
        'stack-name': flags['stack-name'] ?? flags.name,
        'verbose': flags.verbose,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default initBlueprintsCommand
