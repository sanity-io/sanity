import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --edit, -e           Modify the configuration interactively, or directly when combined with ID flags.
  --project-id <id>    Directly set the Project ID in the configuration. Requires --edit flag
  --stack-id <id>      Directly set the Stack ID in the configuration. Requires --edit flag
  --verbose            Output verbose logs

Examples:
  # View current configuration
  sanity blueprints config

  # Edit configuration
  sanity blueprints config --edit
`

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
  helpText,
  signature: '[--edit] [--project-id <id>] [--stack-id <id>] [--verbose]',
  description: 'View or edit local Blueprints configuration',

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
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintConfigCore({
      ...cmdConfig.value,
      token,
      flags: {
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
        'stack-id': flags['stack-id'] ?? flags.stackId ?? flags.stack,
        'edit': flags.edit ?? flags.e,
        'verbose': flags.verbose,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default configBlueprintsCommand
