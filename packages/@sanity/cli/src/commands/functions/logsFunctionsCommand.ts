import {type CliCommandDefinition} from '../../types'

const helpText = `
Arguments
  <name> The name of the Function to retrieve logs for

Options
  --limit <limit> The number of log entries to retrieve [default 50]
  --json          If set return json
  --utc           Use UTC dates in logs
  --delete        Delete all logs for the Function
  --force         Force delete all logs for the Function
  --watch         Watch for new logs (streaming mode)

Examples
  # Retrieve logs for Sanity Function
  sanity functions logs echo

  # Retrieve the last two log entries for Sanity Function
  sanity functions logs echo --limit 2

  # Retrieve logs for Sanity Function in json format
  sanity functions logs echo --json

  # Delete all logs for Sanity Function
  sanity functions logs echo --delete

  # Watch for new logs (streaming mode)
  sanity functions logs echo --watch
`

export interface FunctionsLogsFlags {
  limit?: number
  json?: boolean
  utc?: boolean
  delete?: boolean
  force?: boolean
  watch?: boolean // undocumented for now
}

const defaultFlags = {
  limit: 50,
  json: false,
  utc: false,
  delete: false,
  force: false,
  watch: false,
}

const logsFunctionsCommand: CliCommandDefinition<FunctionsLogsFlags> = {
  name: 'logs',
  group: 'functions',
  helpText,
  signature: '<name> [--limit <number>] [--json] [--utc] [--delete [--force]] [--watch]',
  description: 'Retrieve or delete logs for a Sanity Function',
  async action(args, context) {
    const {apiClient, output} = context
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

    const {initDeployedBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {functionLogsCore} = await import('@sanity/runtime-cli/cores/functions')

    const cmdConfig = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await functionLogsCore({
      ...cmdConfig.value,
      args: {name},
      flags,
    })

    if (!success) throw new Error(error)
  },
}

export default logsFunctionsCommand
