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
      print('You must provide a function name')
      return
    }

    const {blueprintsActions, functionsActions, utils} = await import('@sanity/runtime-cli')

    const {parsedBlueprint} = await blueprintsActions.blueprint.readBlueprintOnDisk({
      getStack: false,
    })

    const src = utils.findFunctions.getFunctionSource(parsedBlueprint, flags.name)
    if (!src) {
      print(`Error: Function ${flags.name} has no source code`)
    }

    const {json, logs, error} = await functionsActions.test.testAction(src, {
      data: flags.data,
      file: flags.file,
      timeout: flags.timeout,
    })

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
