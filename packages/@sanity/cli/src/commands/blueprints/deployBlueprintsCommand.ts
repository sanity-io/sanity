import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --no-wait    Do not wait for deployment to complete

Examples:
  # Deploy the current blueprint
  sanity blueprints deploy

  # Deploy the current blueprint without waiting for completion
  sanity blueprints deploy --no-wait
`

export interface BlueprintsDeployFlags {
  'no-wait'?: boolean
}

const defaultFlags: BlueprintsDeployFlags = {
  //
}

const deployBlueprintsCommand: CliCommandDefinition<BlueprintsDeployFlags> = {
  name: 'deploy',
  group: 'blueprints',
  helpText,
  signature: '[--no-wait]',
  description: 'Deploy a Blueprint to create or update a Stack',

  async action(args, context) {
    const {apiClient, output} = context
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {blueprintDeployCore} = await import('@sanity/runtime-cli/cores/blueprints')
    const {getBlueprintAndStack} = await import('@sanity/runtime-cli/actions/blueprints')
    const {display} = await import('@sanity/runtime-cli/utils')

    const {localBlueprint, deployedStack, issues} = await getBlueprintAndStack({token})

    if (issues) {
      output.print(display.errors.presentBlueprintIssues(issues))
      throw new Error('Unable to parse Blueprint file.')
    }

    const {projectId, stackId} = localBlueprint
    const auth = {token, projectId}

    const {success, error} = await blueprintDeployCore({
      bin: 'sanity',
      log: (message) => output.print(message),
      auth,
      projectId,
      stackId,
      deployedStack,
      blueprint: localBlueprint,
      flags: {
        'no-wait': flags['no-wait'],
      },
    })

    if (!success) throw new Error(error)
  },
}

export default deployBlueprintsCommand
