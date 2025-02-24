import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --id <id> The ID of the function to retrieve logs for

Examples
  # Retrieve logs for Sanity Function abcd1234
  sanity functions logs --id abcd1234
`

const logsFunctionsCommand: CliCommandDefinition = {
  name: 'logs',
  group: 'functions',
  helpText,
  signature: '',
  description: 'Retrieve logs for a Sanity Function',
  async action(args, context) {
    const {output} = context
    const {print} = output

    print(`Functions stuff`)
  },
}

export default logsFunctionsCommand
