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

    const {blueprintStacksCore} = await import('@sanity/runtime-cli/cores/blueprints')
    const {getBlueprintAndStack} = await import('@sanity/runtime-cli/actions/blueprints')
    const {display} = await import('@sanity/runtime-cli/utils')

    const {localBlueprint, issues} = await getBlueprintAndStack({token})

    if (issues) {
      // print issues and continue
      output.print(display.errors.presentBlueprintIssues(issues))
    }

    const {success, error} = await blueprintStacksCore({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
      blueprint: localBlueprint,
      flags: {
        projectId: flags['project-id'] ?? flags.projectId ?? flags.project,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default stacksBlueprintsCommand
