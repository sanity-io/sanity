import {type CliCommandDefinition} from '../../types'

const helpText = `
Arguments
  <name> The name of the Sanity Function

Options
  --event <create|update|delete> The type of event to simulate (default: 'create')
  --data <data> Data to send to the function
  --data-before <data> Data to send to the function when event is update
  --data-after <data> Data to send to the function when event is update
  --file <file> Read data from file and send to the function
  --file-before <file> Read data from file and send to the function when event is update
  --file-after <file> Read data from file and send to the function when event is update
  --document-id <id> Document to fetch and send to function
  --document-id-before <id> Document to fetch and send to function when event is update
  --document-id-after <id> Document to fetch and send to function when event is update
  --timeout <timeout> Execution timeout value in seconds
  --api <version> Sanity API Version to use
  --dataset <dataset> The Sanity dataset to use
  --project-id <id> Sanity Project ID to use
  --with-user-token Prime access token from CLI config into context.clientOptions
  --media-library-id <id> Sanity Media Library ID to use


Examples
  # Test function passing event data on command line
  sanity functions test echo --data '{ "id": 1 }'

  # Test function passing event data via a file
  sanity functions test echo --file 'payload.json'

  # Test function passing event data on command line and cap execution time to 60 seconds
  sanity functions test echo --data '{ "id": 1 }' --timeout 60

  # Test function simulating an update event
  sanity functions test echo --event update --data-before '{ "title": "before" }' --data-after '{ "title": "after" }'
`

export interface FunctionsTestFlags {
  'data'?: string
  'data-before'?: string
  'data-after'?: string
  'event'?: string
  'file'?: string
  'file-before'?: string
  'file-after'?: string
  'timeout'?: number
  'api'?: string
  'dataset'?: string
  'project-id'?: string
  'document-id'?: string
  'document-id-before'?: string
  'document-id-after'?: string
  'with-user-token'?: boolean
  'media-library-id'?: string
}

const defaultFlags: FunctionsTestFlags = {
  'timeout': 10, // seconds
  'with-user-token': false,
}

const testFunctionsCommand: CliCommandDefinition<FunctionsTestFlags> = {
  name: 'test',
  group: 'functions',
  helpText,
  signature:
    '<name> [--event create|update|delete] [--data <json>] [--data-before <json>] [--data-after <json>] [--file <filename>] [--file-before <filename>] [--file-after <filename>] [--document-id <id>] [--document-id-before <id>] [--document-id-before <id>] [--timeout <seconds>] [--api <version>] [--dataset <name>] [--project-id <id>] [--media-library-id <id>] [--with-user-token]',
  description: 'Invoke a local Sanity Function',
  async action(args, context) {
    const {apiClient, output, chalk} = context
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

    // Prefer projectId in blueprint
    const {blueprint} = await import('@sanity/runtime-cli/actions/blueprints')
    const {projectId: bpProjectId} = await blueprint.readLocalBlueprint()

    if (projectId && projectId !== bpProjectId) {
      output.print(
        chalk.yellow('WARNING'),
        `Project ID ${chalk.cyan(projectId)} in ${chalk.green('sanity.cli.ts')} does not match Project ID ${chalk.cyan(bpProjectId)} in ${chalk.green('./sanity/blueprint.config.json')}.`,
      )
      output.print(
        `Defaulting to Project ID ${chalk.cyan(bpProjectId)}. To override use the ${chalk.green('--project-id')} flag.\n`,
      )
    }

    if (flags.event === 'update') {
      const hasDataPair = flags['data-before'] && flags['data-after']
      const hasFilePair = flags['file-before'] && flags['file-after']
      const hasDocPair = flags['document-id-before'] && flags['document-id-after']

      if (!(hasDataPair || hasFilePair || hasDocPair)) {
        throw new Error(
          'When using --event=update, you must provide one of the following flag pairs:\n' +
            '  --data-before and --data-after\n' +
            '  --file-before and --file-after\n' +
            '  --document-id-before and --document-id-after',
        )
      }
    }

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
        'data-before': flags['data-before'],
        'data-after': flags['data-after'],
        'file': flags.file,
        'file-before': flags['file-before'],
        'file-after': flags['file-after'],
        'document-id': flags['document-id'],
        'document-id-before': flags['document-id-before'],
        'document-id-after': flags['document-id-after'],
        'event': flags.event,
        'timeout': flags.timeout,
        'api': flags.api,
        'dataset': flags.dataset || actualDataset,
        'project-id': flags['project-id'] || bpProjectId,
        'with-user-token': flags['with-user-token'],
        'media-library-id': flags['media-library-id'],
      },
    })

    if (!success) throw new Error(error)
  },
}

export default testFunctionsCommand
