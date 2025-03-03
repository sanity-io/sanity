import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --id <id> The ID of the function to retrieve logs for

Examples
  # Retrieve logs for Sanity Function abcd1234
  sanity functions logs --id abcd1234
`

const defaultFlags = {
  id: undefined,
}

const logsFunctionsCommand: CliCommandDefinition = {
  name: 'logs',
  group: 'functions',
  helpText,
  signature: '',
  description: 'Retrieve logs for a Sanity Function',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    if (flags.id) {
      const token = client.config().token
      if (token) {
        const {logsAction} = await import('@sanity/runtime-cli')
        const result = await logsAction(flags.id, token)
        print(JSON.stringify(result, null, 2))
      }
    } else {
      print('You must provide a function ID')
    }
  },
}

export default logsFunctionsCommand
