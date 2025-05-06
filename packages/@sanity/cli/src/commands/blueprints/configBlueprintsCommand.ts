import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --edit, -e           Edit the configuration
  --test, -t           Test the configuration
  --project-id <id>    Project ID to use

Examples:
  # View current configuration
  sanity blueprints config

  # Edit configuration
  sanity blueprints config --edit

  # Test configuration
  sanity blueprints config --test

  # Edit and test configuration
  sanity blueprints config -et
`

export interface BlueprintsConfigFlags {
  'test-config'?: boolean
  'test'?: boolean
  't'?: boolean
  'edit'?: boolean
  'e'?: boolean
  'project-id'?: string
  'projectId'?: string
  'project'?: string
  'stack-id'?: string
  'stackId'?: string
  'stack'?: string
}

const defaultFlags: BlueprintsConfigFlags = {
  //
}

const configBlueprintsCommand: CliCommandDefinition<BlueprintsConfigFlags> = {
  name: 'config',
  group: 'blueprints',
  helpText,
  signature: '[--edit] [-e] [--test] [-t] [--project-id <id>]',
  description: 'View or edit local Blueprints configuration',
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

    const {blueprintConfigCore} = await import('@sanity/runtime-cli/cores/blueprints')
    const {getBlueprintAndStack} = await import('@sanity/runtime-cli/actions/blueprints')
    const {display} = await import('@sanity/runtime-cli/utils')

    const {localBlueprint, issues} = await getBlueprintAndStack({token})

    if (issues) {
      // print issues and continue
      output.print(display.errors.presentBlueprintIssues(issues))
    }

    const {success, error} = await blueprintConfigCore({
      bin: 'sanity',
      log: (message) => output.print(message),
      blueprint: localBlueprint,
      token,
      flags: {
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
        'stack-id': flags['stack-id'] ?? flags.stackId ?? flags.stack,
        'test-config': flags['test-config'] ?? flags.test ?? flags.t,
        'edit': flags.edit ?? flags.e,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default configBlueprintsCommand
