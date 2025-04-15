import {type StackFunctionResource} from '@sanity/runtime-cli/dist/utils/types'

import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --name <name> The name of the function
  --add Add or update an environment variable
  --remove Remove an environment variable
  --key <key> The name of the environment variable
  --value <value> The value of the environment variable

Examples
  # Add or update an environment variable
  sanity functions env --name echo --add --key API_URL --value https://api.example.com/

  # Remove an environment variable
  sanity functions env --name echo --remove --key API_URL
`

const defaultFlags = {
  name: '',
  add: false,
  remove: false,
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
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    if (flags.name === '') {
      print('You must provide a function name')
      return
    }

    const token = client.config().token
    const {blueprintsActions, functionsActions, utils} = await import('@sanity/runtime-cli')

    const {deployedStack} = await blueprintsActions.blueprint.readBlueprintOnDisk({
      getStack: true,
      token,
    })

    if (!deployedStack) {
      print('Stack not found')
      return
    }

    const blueprintConfig = blueprintsActions.blueprint.readConfigFile()
    const projectId = blueprintConfig?.projectId

    const {externalId} = utils.findFunctions.findFunctionByName(
      deployedStack,
      flags.name,
    ) as StackFunctionResource

    if (token && projectId) {
      if (flags.add) {
        print(`Updating "${flags.key}" environment variable in "${flags.name}"`)
        const result = await functionsActions.env.update.update(
          externalId,
          flags.key,
          flags.value,
          {
            token,
            projectId,
          },
        )
        if (result.ok) {
          print(`Update of ${flags.key} succeeded`)
        } else {
          print(`Failed to update ${flags.key}`)
          print(`Error: ${result.error || 'Unknown error'}`)
        }
      } else if (flags.remove) {
        print(`Removing "${flags.key}" environment variable in "${flags.name}"`)
        const result = await functionsActions.env.remove.remove(externalId, flags.key, {
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
