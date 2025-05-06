import {type CliCommandDefinition} from '../../types'

const helpText = `
Commands
  add    Add or update an environment variable
  list   List the environment variables
  remove Remove an environment variable

Arguments
  <name> The name of the function
  <key> The name of the environment variable
  <value> The value of the environment variable

Examples
  # Add or update an environment variable
  sanity functions env add echo API_URL https://api.example.com/

  # Remove an environment variable
  sanity functions env remove echo API_URL

  # List environment variables
  sanity functions env list echo
`

const envFunctionsCommand: CliCommandDefinition = {
  name: 'env',
  group: 'functions',
  helpText,
  signature: '',
  description:
    'Add or remove an environment variable or list environment variables for a Sanity function',
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    const [subCommand, name, key, value] = args.argsWithoutOptions

    if (!subCommand || !['add', 'list', 'remove'].includes(subCommand)) {
      throw new Error('You must specify if you want to list, add or remove')
    }

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    if (name === '') {
      throw new Error('You must provide a function name via the --name flag')
    }

    const token = client.config().token
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {env: envAction} = await import('@sanity/runtime-cli/actions/functions')
    const {blueprint, getBlueprintAndStack} = await import('@sanity/runtime-cli/actions/blueprints')
    const {findFunction} = await import('@sanity/runtime-cli/utils')

    const {deployedStack} = await getBlueprintAndStack({token})

    if (!deployedStack) {
      throw new Error('Stack not found')
    }

    const blueprintConfig = blueprint.readConfigFile()
    const projectId = blueprintConfig?.projectId

    const {externalId} = findFunction.findFunctionByName(deployedStack, name)

    if (token && projectId) {
      if (subCommand === 'add') {
        print(`Updating "${key}" environment variable in "${name}"`)
        const result = await envAction.update(externalId, key, value, {
          token,
          projectId,
        })
        if (result.ok) {
          print(`Update of "${key}" succeeded`)
        } else {
          print(`Failed to update "${key}"`)
          print(`Error: ${result.error || 'Unknown error'}`)
        }
      } else if (subCommand === 'remove') {
        print(`Removing "${key}" environment variable in "${name}"`)
        const result = await envAction.remove(externalId, key, {
          token,
          projectId,
        })
        if (result.ok) {
          print(`Removal of "${key}" succeeded`)
        } else {
          print(`Failed to remove "${key}"`)
          print(`Error: ${result.error || 'Unknown error'}`)
        }
      } else if (subCommand === 'list') {
        print(`Environment variables in "${name}"`)
        const result = await envAction.list(externalId, {
          token,
          projectId,
        })
        if (result.ok && Array.isArray(result.envvars)) {
          for (const envVarKey of result.envvars) {
            print(envVarKey)
          }
        } else {
          print(`Failed to list environment variables in "${key}"`)
          print(`Error: ${result.error || 'Unknown error'}`)
        }
      }
    } else {
      print('You must run this command from a blueprints project')
    }
  },
}

export default envFunctionsCommand
