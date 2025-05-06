import {type CliCommandDefinition} from '../../types'

const helpText = `
Safe to run at any time. Will not modify any Resources.

Examples:
  # Show deployment plan for the current Blueprint
  sanity blueprints plan
`

export interface BlueprintsPlanFlags {
  //
}

const planBlueprintsCommand: CliCommandDefinition<BlueprintsPlanFlags> = {
  name: 'plan',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'Enumerate Resources to be deployed',
  hideFromHelp: true,

  async action(args, context) {
    const {apiClient, output} = context

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {blueprintPlanCore} = await import('@sanity/runtime-cli/cores/blueprints')
    const {getBlueprintAndStack} = await import('@sanity/runtime-cli/actions/blueprints')
    const {display} = await import('@sanity/runtime-cli/utils')

    const {localBlueprint, issues} = await getBlueprintAndStack({token})

    if (issues) {
      // print issues and continue
      output.print(display.errors.presentBlueprintIssues(issues))
    }

    const {success, error} = await blueprintPlanCore({
      bin: 'sanity',
      log: (message) => output.print(message),
      blueprint: localBlueprint,
    })

    if (!success) throw new Error(error)
  },
}

export default planBlueprintsCommand
