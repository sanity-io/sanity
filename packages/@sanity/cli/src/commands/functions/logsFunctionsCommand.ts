import {logsAction} from '@sanity/runtime-cli'

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
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    if (flags.id) {
      const result = await logsAction(flags.id, client.config().token)

      print(JSON.stringify(result, null, 2))
    }
  },
}

export default logsFunctionsCommand
