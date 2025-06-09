import {type CliCommandDefinition} from '../../types'

const helpText = `
Arguments
  <name> The name of the Sanity Function

Options
  --data <data> Data to send to the function
  --file <file> Read data from file and send to the function
  --timeout <timeout> Execution timeout value in seconds
  --api <version> Sanity API Version to use
  --dataset <dataset> The Sanity dataset to use
  --project-id <id> Sanity Project ID to use


Examples
  # Test function passing event data on command line
  sanity functions test echo --data '{ "id": 1 }'

  # Test function passing event data via a file
  sanity functions test echo --file 'payload.json'

  # Test function passing event data on command line and cap execution time to 60 seconds
  sanity functions test echo --data '{ "id": 1 }' --timeout 60
`

export interface FunctionsTestFlags {
  'data'?: string
  'file'?: string
  'timeout'?: number
  'api'?: string
  'dataset'?: string
  'project-id'?: string
}

const defaultFlags: FunctionsTestFlags = {
  timeout: 10, // seconds
}

const testFunctionsCommand: CliCommandDefinition<FunctionsTestFlags> = {
  name: 'test',
  group: 'functions',
  helpText,
  signature:
    '<name> [--data <json>] [--file <filename>] [--timeout <seconds>] [--api <version>] [--dataset <name>] [--project-id] <id>]',
  description: 'Invoke a local Sanity Function',
  async action(args, context) {
    const {apiClient, output} = context
    const [name] = args.argsWithoutOptions
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {dataset, projectId, token} = client.config()
    const actualDataset = dataset === '~dummy-placeholder-dataset-' ? undefined : dataset

    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    if (!name) {
      throw new Error('You must provide a function name as the first argument')
    }

    const {initBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {functionTestCore} = await import('@sanity/runtime-cli/cores/functions')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: (message: string) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await functionTestCore({
      ...cmdConfig.value,
      args: {name},
      flags: {
        'data': flags.data,
        'file': flags.file,
        'timeout': flags.timeout,
        'api': flags.api,
        'dataset': flags.dataset || actualDataset,
        'project-id': flags['project-id'] || projectId,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default testFunctionsCommand
