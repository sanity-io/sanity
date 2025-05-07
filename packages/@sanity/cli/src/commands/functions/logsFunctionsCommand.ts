import chalk from 'chalk'
import inquirer from 'inquirer'

import {type CliCommandDefinition} from '../../types'

const helpText = `
Arguments
  <name> The name of the Function to retrieve logs for

Options
  --limit <limit> The number of log entries to retrieve [default 50]
  --json If set return json
  --utc Use UTC dates in logs

Examples
  # Retrieve logs for Sanity Function
  sanity functions logs echo

  # Retrieve the last two log entries for Sanity Function
  sanity functions logs echo --limit 2

  # Retrieve logs for Sanity Function in json format
  sanity functions logs --name echo --json

  # Delete all logs for Sanity Function
  sanity functions logs --name echo --delete
`

const defaultFlags = {
  limit: 50,
  json: false,
  utc: false,
  delete: false,
  force: false,
}

const logsFunctionsCommand: CliCommandDefinition = {
  name: 'logs',
  group: 'functions',
  helpText,
  signature: '<name> [--limit <number>] [--json] [--utc] [--delete [--force]]',
  description: 'Retrieve or delete logs for a Sanity Function',
  async action(args, context) {
    const {apiClient, output} = context
    const {print, error: printError} = output
    const [name] = args.argsWithoutOptions
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    if (!name) {
      throw new Error('You must provide a function name as the first argument')
    }

    const token = client.config().token
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {getBlueprintAndStack} = await import('@sanity/runtime-cli/actions/blueprints')
    const {findFunction} = await import('@sanity/runtime-cli/utils')

    const {deployedStack} = await getBlueprintAndStack({token})

    if (!deployedStack) {
      throw new Error('Stack not found')
    }

    const {projectId} = deployedStack

    const {externalId} = findFunction.findFunctionByName(deployedStack, name)

    if (token && projectId) {
      const {logs: logsAction} = await import('@sanity/runtime-cli/actions/functions')

      if (!externalId) throw new Error('Unable to delete logs. Unable to determine function ID.')

      if (flags.delete) {
        if (!flags.force) {
          const {certain} = await inquirer.prompt({
            type: 'confirm',
            name: 'certain',
            message: `Are you sure you want to delete ${chalk.bold('all')} logs for function ${chalk.yellow(name)}?`,
            default: false,
          })
          if (!certain) return
        }

        print(`Deleting logs for function ${chalk.yellow(name)}`)
        const {ok, error} = await logsAction.deleteLogs(externalId, {token, projectId})

        if (!ok) {
          printError(`${chalk.red('Failed')} to retrieve logs`)
          printError(`Error: ${error || 'Unknown error'}`)
          return
        }

        print('Logs deleted')
      } else {
        print(`Finding logs for function "${name}"`)

        const {ok, error, logs, total} = await logsAction.logs(
          externalId,
          {limit: flags.limit},
          {token, projectId},
        )

        if (!ok) {
          printError(`${chalk.red('Failed')} to retrieve logs`)
          printError(`Error: ${error || 'Unknown error'}`)
          return
        }

        const filteredLogs = logs.filter(
          (entry: {level: string; message: string}) => entry.level && entry.message,
        )

        if (filteredLogs.length === 0) {
          print(`No logs found for function ${name}`)
          return
        }

        if (flags.json) {
          print(JSON.stringify(filteredLogs, null, 2))
        } else {
          print(`Found ${total} log entries for function ${name}`)
          if (logs.length < total) {
            print(`Here are the last ${filteredLogs.length} entries`)
          }
          print('\n')

          for (const log of filteredLogs) {
            const {time, level, message} = log
            const date = new Date(time)
            const [dateString, timeString] = flags.utc
              ? date.toISOString().slice(0, 19).split('T')
              : [date.toLocaleDateString(), date.toLocaleTimeString()]
            print(
              [chalk.bold(dateString), chalk.bold.blue(timeString), logLevel(level), message].join(
                ' ',
              ),
            )
          }
        }
      }
    } else {
      print('You must run this command from a blueprints project')
    }
  },
}

function logLevel(level: string) {
  if (level === 'ERROR') {
    return chalk.red(level)
  }
  if (level === 'WARN') {
    return chalk.yellow(level)
  }
  return chalk.green(level)
}

export default logsFunctionsCommand
