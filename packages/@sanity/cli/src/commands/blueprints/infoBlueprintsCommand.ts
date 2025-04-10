import {type CliCommandDefinition} from '../../types'

const helpText = `
`

const defaultFlags = {id: undefined}

const infoBlueprintsCommand: CliCommandDefinition = {
  name: 'info',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'Retrieve information about a Sanity Blueprint',
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
    const {
      blueprintsActions: actions,
      utils: {display},
    } = await import('@sanity/runtime-cli')

    const {errors, deployedStack, projectId} = await actions.blueprint.readBlueprintOnDisk({
      getStack: true,
    })

    if (errors && errors.length > 0) {
      print(errors)
      return
    }

    if (token && projectId) {
      const auth = {token, projectId}
      let result
      if (flags.id) {
        const {stack, error, ok} = await actions.stacks.getStack({stackId: flags.id, auth})
        if (ok) {
          result = stack
        } else {
          print(error)
        }
      } else {
        result = deployedStack
      }

      print(display.blueprintsFormatting.formatStackInfo(result))
    } else {
      print('Cannot retrieve information for Blueprint: missing API token or project ID')
    }
  },
}

export default infoBlueprintsCommand
