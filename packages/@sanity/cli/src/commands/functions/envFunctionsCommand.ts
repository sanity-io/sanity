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

export interface FunctionsEnvFlags {
  //
}

const envFunctionsCommand: CliCommandDefinition<FunctionsEnvFlags> = {
  name: 'env',
  group: 'functions',
  helpText,
  signature: '<add|list|remove> <name> [key] [value]',
  description:
    'Add or remove an environment variable or list environment variables for a Sanity function',
  async action(args, context) {
    const {apiClient, output} = context
    const [subCommand, name, key, value] = args.argsWithoutOptions

    if (!subCommand || !['add', 'list', 'remove'].includes(subCommand)) {
      throw new Error('You must specify if you want to list, add or remove')
    }

    if (subCommand === 'add' && (!key || !value)) {
      throw new Error('You must specify the name, key and value arguments')
    } else if (subCommand === 'remove' && !key) {
      throw new Error('You must specify the name and key arguments')
    }

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    if (!name) {
      throw new Error('You must provide a function name as the first argument')
    }

    const token = client.config().token
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {initDeployedBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {functionEnvAddCore, functionEnvListCore, functionEnvRemoveCore} = await import(
      '@sanity/runtime-cli/cores/functions'
    )

    const cmdConfig = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: (message) => output.print(message),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    let response
    switch (subCommand) {
      case 'add':
        response = await functionEnvAddCore({
          ...cmdConfig.value,
          args: {name, key, value},
        })
        break
      case 'list':
        response = await functionEnvListCore({
          ...cmdConfig.value,
          args: {name},
        })
        break
      case 'remove':
        response = await functionEnvRemoveCore({
          ...cmdConfig.value,
          args: {name, key},
        })
        break
      default:
        throw new Error(`Unknown subcommand: ${subCommand}`)
    }

    const {success, error} = response

    if (!success) throw new Error(error)
  },
}

export default envFunctionsCommand
