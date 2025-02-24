import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --data <data> Data to send to the function
  --file <file> Read data from file and send to the function
  --timeout <timeout> Execution timeout value in seconds

Examples
  # Test function passing event data on command line
  sanity functions test ./test.ts --data '{ "id": 1 }'

  # Test function passing event data via a file
  sanity functions test ./test.js --file 'payload.json'

  # Test function passing event data on command line and cap execution time to 60 seconds
  sanity functions test ./test.ts --data '{ "id": 1 }' --timeout 60
`

const testFunctionsCommand: CliCommandDefinition = {
  name: 'test',
  group: 'functions',
  helpText,
  signature: '',
  description: 'Invoke a local Sanity Function',
  async action(args, context) {
    const {output} = context
    const {print} = output

    print(`Functions stuff`)
  },
}

export default testFunctionsCommand
