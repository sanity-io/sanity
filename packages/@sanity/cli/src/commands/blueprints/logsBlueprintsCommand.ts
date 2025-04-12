import {type CliCommandDefinition} from '../../types'

const helpText = `
${
  /*Options
  --watch, -w  Watch for new logs (streaming mode)
*/ ''
}
Examples
  # Show logs for the current Stack
  sanity blueprints logs
${
  /*
  # Watch for new logs
  sanity blueprints logs --watch
*/ ''
}
`

// const defaultFlags = {watch: false}

const logsBlueprintsCommand: CliCommandDefinition = {
  name: 'logs',
  group: 'blueprints',
  helpText,
  signature: '[--watch]',
  description: 'Display logs for the current Blueprint Stack',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    // const flags = {...defaultFlags, ...args.extOptions}
    // const watchMode = Boolean(flags.watch)

    const client = apiClient({requireUser: true, requireProject: false})
    const {token} = client.config()

    if (!token) {
      print('No API token found. Please run `sanity login` first.')
      return
    }

    const {
      blueprintsActions: actions,
      utils: {display},
    } = await import('@sanity/runtime-cli')

    let blueprint = null
    try {
      blueprint = await actions.blueprint.readBlueprintOnDisk({token})
    } catch (error) {
      print('Unable to read Blueprint manifest file. Run `sanity blueprints init`')
      return
    }

    if (!blueprint) {
      print('Unable to read Blueprint manifest file. Run `sanity blueprints init`')
      return
    }

    const {errors, deployedStack} = blueprint

    if (errors && errors.length > 0) {
      print(errors)
      return
    }

    if (!deployedStack) {
      print('Stack not found')
      return
    }

    const {id: stackId, projectId, name} = deployedStack
    const auth = {token, projectId}

    print(`Fetching logs for stack ${display.colors.yellow(`<${stackId}>`)}`)

    // enable watch mode here

    try {
      const {ok, logs, error} = await actions.logs.getLogs(stackId, auth)

      if (!ok) {
        print(`${display.colors.red('Failed')} to retrieve logs`)
        print(`Error: ${error || 'Unknown error'}`)
        return
      }

      if (logs.length === 0) {
        print(`No logs found for Stack ${stackId}`)
        return
      }

      print(`${display.blueprintsFormatting.formatTitle('Blueprint', name)} Logs`)
      print(
        `Found ${display.colors.bold(logs.length.toString())} log entries for stack ${display.colors.yellow(stackId)}\n`,
      )

      // Organize and format logs by day
      const logsByDay = display.logsFormatting.organizeLogsByDay(logs)
      print(display.logsFormatting.formatLogsByDay(logsByDay))
    } catch (err) {
      print('Failed to retrieve logs')
      if (err instanceof Error) {
        print(`Error: ${err.message}`)
      }
    }
  },
}

export default logsBlueprintsCommand
