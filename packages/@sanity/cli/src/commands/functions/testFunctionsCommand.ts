import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --data <data> Data to send to the function
  --file <file> Read data from file and send to the function
  --path <path> Path to your Sanity Function code
  --timeout <timeout> Execution timeout value in seconds

Examples
  # Test function passing event data on command line
  sanity functions test --path ./test.ts --data '{ "id": 1 }'

  # Test function passing event data via a file
  sanity functions test -path ./test.js --file 'payload.json'

  # Test function passing event data on command line and cap execution time to 60 seconds
  sanity functions test -path ./test.ts --data '{ "id": 1 }' --timeout 60
`

const defaultFlags = {
  data: undefined,
  file: undefined,
  path: undefined,
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

    if (flags.path) {
      const {testAction} = await import('@sanity/runtime-cli')
      const {json, logs, error} = await testAction(flags.path, {
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
    } else {
      print('You must provide a path to the Sanity Function code')
    }
  },
}

export default testFunctionsCommand
