import {type types} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'

type StackFunctionResource = types.StackFunctionResource

const helpText = `
Arguments
  [add] Add or update an environment variable
  [remove] Remove an environment variable

Options
  --name <name> The name of the function
  --key <key> The name of the environment variable
  --value <value> The value of the environment variable

Examples
  # Add or update an environment variable
  sanity functions env add --name echo --key API_URL --value https://api.example.com/

  # Remove an environment variable
  sanity functions env remove --name echo --key API_URL
`

const defaultFlags = {
  name: '',
  key: '',
  value: '',
}

const envFunctionsCommand: CliCommandDefinition = {
  name: 'env',
  group: 'functions',
  helpText,
  signature: '',
  description: 'Add or remove an environment variable for a Sanity function',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    const [subCommand] = args.argsWithoutOptions
    const flags = {...defaultFlags, ...args.extOptions}

    if (!subCommand || !['add', 'remove'].includes(subCommand)) {
      throw new Error('You must specify if you wish to add or remove an environment variable')
    }

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    if (flags.name === '') {
      throw new Error('You must provide a function name via the --name flag')
    }

    const token = client.config().token
    const {env} = await import('@sanity/runtime-cli/actions/functions')
    const {blueprint} = await import('@sanity/runtime-cli/actions/blueprints')
    const {findFunction} = await import('@sanity/runtime-cli/utils')

    const {deployedStack} = await blueprint.readBlueprintOnDisk({
      getStack: true,
      token,
    })

    if (!deployedStack) {
      throw new Error('Stack not found')
    }

    const blueprintConfig = blueprint.readConfigFile()
    const projectId = blueprintConfig?.projectId

    const {externalId} = findFunction.findFunctionByName(
      deployedStack,
      flags.name,
    ) as StackFunctionResource

    if (token && projectId) {
      if (subCommand === 'add') {
        print(`Updating "${flags.key}" environment variable in "${flags.name}"`)
        const result = await env.update.update(externalId, flags.key, flags.value, {
          token,
          projectId,
        })
        if (result.ok) {
          print(`Update of ${flags.key} succeeded`)
        } else {
          print(`Failed to update ${flags.key}`)
          print(`Error: ${result.error || 'Unknown error'}`)
        }
      } else if (subCommand === 'remove') {
        print(`Removing "${flags.key}" environment variable in "${flags.name}"`)
        const result = await env.remove.remove(externalId, flags.key, {
          token,
          projectId,
        })
        if (result.ok) {
          print(`Remove of ${flags.key} succeeded`)
        } else {
          print(`Failed to remove ${flags.key}`)
          print(`Error: ${result.error || 'Unknown error'}`)
        }
      }
    } else {
      print('You must run this command from a blueprints project')
    }
  },
}

export default envFunctionsCommand
