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

    const {blueprintLogsCore} = await import('@sanity/runtime-cli/cores/blueprints')
    const {getBlueprintAndStack} = await import('@sanity/runtime-cli/actions/blueprints')
    const {display} = await import('@sanity/runtime-cli/utils')

    const {localBlueprint, deployedStack, issues} = await getBlueprintAndStack({token})

    if (issues) {
      output.print(display.errors.presentBlueprintIssues(issues))
      throw new Error('Unable to parse Blueprint file.')
    }

    const {projectId, stackId} = localBlueprint
    const auth = {token, projectId}

    const {success, streaming, error} = await blueprintLogsCore({
      bin: 'sanity',
      log: (message) => output.print(message),
      auth,
      stackId,
      deployedStack,
      flags: {
        watch: flags.watch ?? flags.w,
      },
    })

    if (streaming) await streaming

    if (!success) throw new Error(error)
  },
}

export default logsBlueprintsCommand
