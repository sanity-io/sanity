import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples:
  # Retrieve information about the current Stack
  sanity blueprints info
`

export interface BlueprintsInfoFlags {
  id?: string
}

const defaultFlags: BlueprintsInfoFlags = {
  //
}

const infoBlueprintsCommand: CliCommandDefinition<BlueprintsInfoFlags> = {
  name: 'info',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'Retrieve information about a Blueprint Stack',
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

    const {blueprintInfoCore} = await import('@sanity/runtime-cli/cores/blueprints')
    const {getBlueprintAndStack} = await import('@sanity/runtime-cli/actions/blueprints')
    const {display} = await import('@sanity/runtime-cli/utils')

    const {localBlueprint, deployedStack, issues} = await getBlueprintAndStack({token})

    if (issues) {
      output.print(display.errors.presentBlueprintIssues(issues))
      throw new Error('Unable to parse Blueprint file.')
    }

    const {projectId, stackId} = localBlueprint
    const auth = {token, projectId}

    const {success, error} = await blueprintInfoCore({
      bin: 'sanity',
      log: (message) => output.print(message),
      auth,
      stackId,
      deployedStack,
      flags,
    })

    if (!success) throw new Error(error)
  },
}

export default infoBlueprintsCommand
