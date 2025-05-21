import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --watch, -w    Watch for new logs (streaming mode)

Examples:
  # Show logs for the current Stack
  sanity blueprints logs

  # Watch for new logs (streaming mode)
  sanity blueprints logs --watch
`

export interface BlueprintsLogsFlags {
  watch?: boolean
  w?: boolean
}

const defaultFlags: BlueprintsLogsFlags = {
  //
}

const logsBlueprintsCommand: CliCommandDefinition<BlueprintsLogsFlags> = {
  name: 'logs',
  group: 'blueprints',
  helpText,
  signature: '[--watch] [-w]',
  description: 'Display logs for the current Blueprint Stack',

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
    const {blueprintLogsCore} = await import('@sanity/runtime-cli/cores/blueprints')

    const cmdConfig = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, streaming, error} = await blueprintLogsCore({
      ...cmdConfig.value,
      flags: {
        watch: flags.watch ?? flags.w,
      },
    })

    if (streaming) await streaming

    if (!success) throw new Error(error)
  },
}

export default logsBlueprintsCommand
