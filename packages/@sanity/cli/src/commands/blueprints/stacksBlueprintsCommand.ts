import {type CliCommandDefinition} from '../../types'

const helpText = `
List all Blueprint Stacks for the current project.

Examples
  # List all stacks for the current project
  sanity blueprints stacks
`

const stacksBlueprintsCommand: CliCommandDefinition = {
  name: 'stacks',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'List all Blueprint Stacks',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output
    const client = apiClient({requireUser: true, requireProject: false})
    const {token} = client.config()

    if (!token) {
      print('No API token found. Please set a token using `sanity login` first.')
      return
    }

    const {
      blueprintsActions: actions,
      utils: {display},
    } = await import('@sanity/runtime-cli')

    const {errors, projectId, stackId} = await actions.blueprint.readBlueprintOnDisk()

    if (errors && errors.length > 0) {
      print(errors)
      return
    }

    if (!projectId) {
      print('Blueprint is not configured for a project. Run `sanity blueprints config`')
      return
    }

    const auth = {token, projectId}
    const {ok, stacks, error} = await actions.stacks.listStacks(auth)

    if (!ok) {
      print(error || 'Failed to list stacks')
      return
    }

    if (!stacks || stacks.length === 0) {
      print('No stacks found')
      return
    }

    const {bold, yellow} = display.colors
    print(`${bold('Project')} <${yellow(projectId)}> ${bold('Stacks')}:\n`)
    print(display.blueprintsFormatting.formatStacksListing(stacks, stackId))
  },
}

export default stacksBlueprintsCommand
