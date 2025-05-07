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

const defaultFlags = {
  'data': undefined,
  'file': undefined,
  'timeout': 5, // seconds
  'api': undefined,
  'dataset': undefined,
  'project-id': undefined,
  'project': undefined,
  'projectId': undefined,
}

const testFunctionsCommand: CliCommandDefinition = {
  name: 'test',
  group: 'functions',
  helpText,
  signature:
    '<name> [--data <json>] [--file <filename>] [--timeout <seconds>] [--api <version>] [--dataset <name>] [--project-id] <id>]',
  description: 'Invoke a local Sanity Function',
  async action(args, context) {
    const {output} = context
    const {print, error: printError} = output
    const [name] = args.argsWithoutOptions
    const flags = {...defaultFlags, ...args.extOptions}

    if (!name) {
      throw new Error('You must provide a function name as the first argument')
    }

    const {test} = await import('@sanity/runtime-cli/actions/functions')
    const {blueprint} = await import('@sanity/runtime-cli/actions/blueprints')
    const {findFunction} = await import('@sanity/runtime-cli/utils')

    const {parsedBlueprint} = await blueprint.readLocalBlueprint()

    try {
      const fn = findFunction.findFunctionByName(parsedBlueprint, name)
      if (!fn) {
        throw new Error(`Function ${name} has no source code`)
      }

      const projectId = flags['project-id'] ?? flags.projectId ?? flags.project
      const {json, logs, error} = await test.testAction(
        fn,
        {
          data: flags.data,
          file: flags.file,
          timeout: flags.timeout,
        },
        {
          clientOptions: {
            apiVersion: flags.api,
            dataset: flags.dataset,
            projectId: projectId,
          },
        },
      )

      if (error) {
        print(error.toString())
      } else {
        print('Logs:')
        print(logs)
        print('Response:')
        print(JSON.stringify(json, null, 2))
      }
    } catch (error) {
      printError(`Error: ${error || 'Unknown error'}`)
    }
  },
}

export default testFunctionsCommand
