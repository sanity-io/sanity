import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --project-id <id>    Project ID to use

Examples:
  # List all Stacks for the current Project
  sanity blueprints stacks

  # List Stacks for a specific project
  sanity blueprints stacks --project-id abc123
`

export interface BlueprintsStacksFlags {
  'project-id'?: string
  'projectId'?: string
  'project'?: string
}

const defaultFlags: BlueprintsStacksFlags = {
  //
}

const stacksBlueprintsCommand: CliCommandDefinition<BlueprintsStacksFlags> = {
  name: 'stacks',
  group: 'blueprints',
  helpText,
  signature: '[--project-id <id>]',
  description: 'List all Blueprint Stacks for the current Project',
  hideFromHelp: true,

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
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintStacksCore({
      ...cmdConfig.value,
      flags: {
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default stacksBlueprintsCommand
