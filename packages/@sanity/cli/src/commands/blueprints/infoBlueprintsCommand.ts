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

  async action(args, context) {
    const {apiClient, output} = context
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {initDeployedBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {blueprintInfoCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintInfoCore({
      ...cmdConfig.value,
      flags,
    })

    if (!success) throw new Error(error)
  },
}

export default infoBlueprintsCommand
