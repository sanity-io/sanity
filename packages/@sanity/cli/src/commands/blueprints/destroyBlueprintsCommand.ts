import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --force, -f    Force destroy without confirmation
  --no-wait      Do not wait for destroy to complete

Examples:
  # Destroy the current deployment
  sanity blueprints destroy

  # Force destroy without confirmation
  sanity blueprints destroy --force

  # Destroy without waiting for completion
  sanity blueprints destroy --no-wait
`

export interface BlueprintsDestroyFlags {
  'force'?: boolean
  'f'?: boolean
  'project-id'?: string
  'projectId'?: string
  'project'?: string
  'stack-id'?: string
  'stackId'?: string
  'stack'?: string
  'no-wait'?: boolean
}

const defaultFlags: BlueprintsDestroyFlags = {
  //
}

const destroyBlueprintsCommand: CliCommandDefinition<BlueprintsDestroyFlags> = {
  name: 'destroy',
  group: 'blueprints',
  helpText,
  signature: '[--force] [-f] [--no-wait]',
  description: 'Destroy a Blueprint deployment',

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
    const {blueprintDestroyCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintDestroyCore({
      ...cmdConfig.value,
      flags: {
        'no-wait': flags['no-wait'],
        'force': flags.force ?? flags.f,
        'project-id': flags['project-id'] ?? flags.projectId ?? flags.project,
        'stack-id': flags['stack-id'] ?? flags.stackId ?? flags.stack,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default destroyBlueprintsCommand
