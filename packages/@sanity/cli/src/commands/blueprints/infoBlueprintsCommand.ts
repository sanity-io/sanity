import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --id, -i  Stack ID

Examples
  # Retrieve information about the current Stack
  sanity blueprints info

  # Retrieve information about a specific Stack
  sanity blueprints info --id <stack-id>
`

const defaultFlags = {id: undefined}

const infoBlueprintsCommand: CliCommandDefinition = {
  name: 'info',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'Retrieve information about a Blueprint Stack',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    const {blueprint: blueprintAction, stacks: stacksAction} = await import(
      '@sanity/runtime-cli/actions/blueprints'
    )
    const {display} = await import('@sanity/runtime-cli/utils')

    let blueprint = null
    try {
      blueprint = await blueprintAction.readBlueprintOnDisk({token})
    } catch (error) {
      print('Unable to read Blueprint manifest file. Run `sanity blueprints init`')
      return
    }

    if (!blueprint) {
      print('Unable to read Blueprint manifest file. Run `sanity blueprints init`')
      return
    }

    const {errors, deployedStack, projectId} = blueprint

    if (errors && errors.length > 0) {
      print(errors)
      return
    }

    if (token && projectId) {
      const auth = {token, projectId}
      let result
      if (flags.id) {
        const {stack, error, ok} = await stacksAction.getStack({stackId: flags.id, auth})
        if (ok) {
          result = stack
        } else {
          print(error)
        }
      } else {
        result = deployedStack
      }

      if (result) {
        print(display.blueprintsFormatting.formatStackInfo(result))
      } else {
        print('No Stack found')
      }
    } else {
      print('Cannot retrieve information for Blueprint: missing API token or Project ID')
    }
  },
}

export default infoBlueprintsCommand
