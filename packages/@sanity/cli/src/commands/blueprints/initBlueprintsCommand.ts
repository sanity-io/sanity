import {type CliCommandDefinition} from '../../types'

const helpText = `
Arguments
  [dir]  Path to initialize the Blueprint in

Options
  --blueprint-type, --type <json>    Type of Blueprint to create
  --project-id <id>                  Project ID to use

Examples:
  # Create a new Blueprint manifest file in the current directory
  sanity blueprints init

  # Create a new Blueprint manifest file in a specific directory
  sanity blueprints init my-sanity-project --type json
`

export interface BlueprintsInitFlags {
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
}

const defaultFlags: BlueprintsInitFlags = {
  //
}

const initBlueprintsCommand: CliCommandDefinition<BlueprintsInitFlags> = {
  name: 'init',
  group: 'blueprints',
  helpText,
  signature: '[dir] [--blueprint-type <type>] [--project-id <id>]',
  description: 'Initialize a new Blueprint manifest file',

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

    const {success, error} = await blueprintInitCore({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
      args: {
        dir: dir ?? flags.dir,
      },
      flags: {
        'blueprint-type': flags['blueprint-type'] ?? flags.type,
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
        'stack-id': flags['stack-id'] ?? flags.stackId ?? flags.stack,
        'stack-name': flags['stack-name'] ?? flags.name,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default initBlueprintsCommand
