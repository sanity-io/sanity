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

  async action(args, context) {
    const {apiClient, output} = context

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {initBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {blueprintPlanCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintPlanCore({
      ...cmdConfig.value,
    })

    if (!success) throw new Error(error)
  },
}

export default planBlueprintsCommand
