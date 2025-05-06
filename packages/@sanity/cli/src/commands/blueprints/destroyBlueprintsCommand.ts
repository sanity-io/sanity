import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  # Destroy the current deployment
  sanity blueprints destroy
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
  signature: '',
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

    const {blueprintDestroyCore} = await import('@sanity/runtime-cli/cores/blueprints')
    const {getBlueprintAndStack} = await import('@sanity/runtime-cli/actions/blueprints')

    const {localBlueprint} = await getBlueprintAndStack({token})

    const {success, error} = await blueprintDestroyCore({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
      blueprint: localBlueprint,
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
