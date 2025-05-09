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
  signature: '<add|list|remove> <name> [key] [value]',
  description:
    'Add or remove an environment variable or list environment variables for a Sanity function',
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    const [subCommand, name, key, value] = args.argsWithoutOptions

    if (!subCommand || !['add', 'list', 'remove'].includes(subCommand)) {
      throw new Error('You must specify if you want to list, add or remove')
    }

    if (!name) {
      throw new Error('You must provide a function name as the first argument')
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

    const token = client.config().token
    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    const {initDeployedBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const cmdConfigResult = await initDeployedBlueprintConfig({
      bin: 'sanity',
      log: (msg: string) => print(msg),
      sanityToken: token,
    })
    if (!cmdConfigResult.ok) {
      throw new Error(cmdConfigResult.error)
    }
    const cmdConfig = cmdConfigResult.value

    const {envAddCore, envListCore, envRemoveCore} = await import(
      '@sanity/runtime-cli/cores/functions'
    )

    if (subCommand === 'add') {
      const addResult = await envAddCore({
        ...cmdConfig,
        args: {name, key, value},
      })

      if (!addResult.success) {
        throw new Error(addResult.error)
      }
    }
    if (subCommand === 'remove') {
      const removeResult = await envRemoveCore({
        ...cmdConfig,
        args: {name, key},
      })

      if (!removeResult.success) {
        throw new Error(removeResult.error)
      }
    } else if (subCommand === 'list') {
      const removeResult = await envListCore({
        ...cmdConfig,
        args: {name},
      })

      if (!removeResult.success) {
        throw new Error(removeResult.error)
      }
    }
  },
}

export default envFunctionsCommand
