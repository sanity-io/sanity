import {type StackFunctionResource} from '@sanity/runtime-cli/dist/utils/types'

import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --name <name> The name of the function to retrieve logs for
  --limit <limit> The number of log entries to retrieve
  --json If set return json

Examples
  # Retrieve logs for Sanity Function abcd1234
  sanity functions logs --name echo

  # Retrieve the last two log entries for Sanity Function abcd1234
  sanity functions logs --name echo --limit 2

  # Retrieve logs for Sanity Function abcd1234 in json format
  sanity functions logs --name echo --json
`

const defaultFlags = {
  name: '',
  limit: 50,
  json: false,
}

const logsFunctionsCommand: CliCommandDefinition = {
  name: 'logs',
  group: 'functions',
  helpText,
  signature: '',
  description: 'Retrieve logs for a Sanity Function',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    if (flags.name === '') {
      print('You must provide a function name')
      return
    }

    const token = client.config().token
    const {blueprintsActions, utils} = await import('@sanity/runtime-cli')

    const {deployedStack} = await blueprintsActions.blueprint.readBlueprintOnDisk({
      getStack: true,
      token,
    })

    if (!deployedStack) {
      print('Stack not found')
      return
    }

    const blueprintConfig = blueprintsActions.blueprint.readConfigFile()
    const projectId = blueprintConfig?.projectId

    const {externalId} = utils.findFunctions.findFunctionByName(
      deployedStack,
      flags.name,
    ) as StackFunctionResource

    if (token && projectId) {
      const {functionsActions} = await import('@sanity/runtime-cli')
      const {ok, error, logs, total} = await functionsActions.logs.logs(
        externalId,
        {limit: flags.limit},
        {token, projectId},
      )

      if (!ok) {
        print(`Error: ${error || 'Unknown error'}`)
        return
      }

      const filteredLogs = logs.filter(
        (entry: {level: string; message: string}) => entry.level && entry.message,
      )

      if (filteredLogs.length === 0) {
        print(`No logs found for function ${flags.name}`)
        return
      }

      if (flags.json) {
        print(JSON.stringify(filteredLogs, null, 2))
      } else {
        print(`Found ${total} log entries for function ${flags.name}`)
        if (logs.length < total) {
          print(`Here are the last ${filteredLogs.length} entries`)
        }
        print('\n')

        for (const log of filteredLogs) {
          const {time, level, message} = log
          const date = new Date(time)
          print(`${date.toLocaleDateString()} ${date.toLocaleTimeString()} ${level} ${message}`)
        }
      }
    } else {
      print('You must run this command from a blueprints project')
    }
  },
}

export default logsFunctionsCommand
