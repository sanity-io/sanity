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

    const {initDeployedBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {blueprintDeployCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await blueprintDeployCore({
      ...cmdConfig.value,
      flags: {
        'no-wait': flags['no-wait'],
      },
    })

    if (!success) throw new Error(error)
  },
}

export default deployBlueprintsCommand
