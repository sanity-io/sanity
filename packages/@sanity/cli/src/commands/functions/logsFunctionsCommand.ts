import {type types} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'

type StackFunctionResource = types.StackFunctionResource

const helpText = `
Options
  --name <name> The name of the function to retrieve logs for
  --limit <limit> The number of log entries to retrieve [default 50]
  --json If set return json
  --utc Use UTC dates in logs

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
  utc: false,
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
      throw new Error('You must provide a function name via the --name flag')
    }

    const token = client.config().token
    const {blueprint} = await import('@sanity/runtime-cli/actions/blueprints')
    const {findFunction} = await import('@sanity/runtime-cli/utils')

    const {deployedStack} = await blueprint.readBlueprintOnDisk({
      getStack: true,
      token,
    })

    if (!deployedStack) {
      throw new Error('Stack not found')
    }

    const blueprintConfig = blueprint.readConfigFile()
    const projectId = blueprintConfig?.projectId

    const {externalId} = findFunction.findFunctionByName(
      deployedStack,
      flags.name,
    ) as StackFunctionResource

    if (token && projectId) {
      const {logs: logsAction} = await import('@sanity/runtime-cli/actions/functions')
      const {ok, error, logs, total} = await logsAction.logs(
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
          const dateString = flags.utc
            ? date.toISOString().slice(0, 19).split('T').join(' ')
            : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
          print(`${dateString} ${level} ${message}`)
        }
      }
    } else {
      print('You must run this command from a blueprints project')
    }
  },
}

export default logsFunctionsCommand
