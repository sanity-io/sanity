import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --data <data> Data to send to the function
  --file <file> Read data from file and send to the function
  --name <name> The name of your Sanity Function
  --timeout <timeout> Execution timeout value in seconds

Examples
  # Test function passing event data on command line
  sanity functions test --name echo --data '{ "id": 1 }'

  # Test function passing event data via a file
  sanity functions test -name echo --file 'payload.json'

  # Test function passing event data on command line and cap execution time to 60 seconds
  sanity functions test -name echo --data '{ "id": 1 }' --timeout 60
`

const defaultFlags = {
  data: undefined,
  file: undefined,
  name: '',
  timeout: 5, // seconds
}

const testFunctionsCommand: CliCommandDefinition = {
  name: 'test',
  group: 'functions',
  helpText,
  signature: '',
  description: 'Invoke a local Sanity Function',
  hideFromHelp: true,
  async action(args, context) {
    const {output} = context
    const {print} = output
    const flags = {...defaultFlags, ...args.extOptions}

    if (flags.name === '') {
      throw new Error('You must provide a function name via the --name flag')
    }

    const {test} = await import('@sanity/runtime-cli/actions/functions')
    const {blueprint} = await import('@sanity/runtime-cli/actions/blueprints')
    const {findFunction} = await import('@sanity/runtime-cli/utils')

    const {parsedBlueprint} = await blueprint.readBlueprintOnDisk({
      getStack: false,
    })

    const src = findFunction.getFunctionSource(parsedBlueprint, flags.name)
    if (!src) {
      throw new Error(`Error: Function ${flags.name} has no source code`)
    }

    const {json, logs, error} = await test.testAction(
      src,
      {
        data: flags.data,
        file: flags.file,
        timeout: flags.timeout,
      },
      {}, // @TODO: Add context
    )

    if (error) {
      print(error.toString())
    } else {
      print('Logs:')
      print(logs)
      print('Response:')
      print(JSON.stringify(json, null, 2))
    }
  },
}

export default testFunctionsCommand
