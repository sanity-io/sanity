import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  # List all Stacks for the current Project
  sanity blueprints stacks
`

const stacksBlueprintsCommand: CliCommandDefinition = {
  name: 'stacks',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'List all Blueprint Stacks for the current Project',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    const client = apiClient({requireUser: true, requireProject: false})
    const {token} = client.config()

    if (!token) {
      print('No API token found. Please run `sanity login` first.')
      return
    }

    const {
      blueprintsActions: actions,
      utils: {display},
    } = await import('@sanity/runtime-cli')

    let blueprint = null
    try {
      blueprint = await actions.blueprint.readBlueprintOnDisk({token})
    } catch (error) {
      print('Unable to read Blueprint manifest file. Run `sanity blueprints init`')
      return
    }

    if (!blueprint) {
      print('Unable to read Blueprint manifest file. Run `sanity blueprints init`')
      return
    }

    const {errors, projectId, stackId} = blueprint

    if (errors && errors.length > 0) {
      print(errors)
      return
    }

    if (!projectId) {
      print('Blueprint is not configured for a Project. Run `sanity blueprints config`')
      return
    }

    const auth = {token, projectId}
    const {ok, stacks, error} = await actions.stacks.listStacks(auth)

    if (!ok) {
      print(error || 'Failed to list Stacks')
      return
    }

    if (!stacks || stacks.length === 0) {
      print('No Stacks found')
      return
    }

    const {bold, yellow} = display.colors
    print(`${bold('Project')} <${yellow(projectId)}> ${bold('Stacks')}:\n`)
    print(display.blueprintsFormatting.formatStacksListing(stacks, stackId))
  },
}

export default stacksBlueprintsCommand
