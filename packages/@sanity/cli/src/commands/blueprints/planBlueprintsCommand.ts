import {type CliCommandDefinition} from '../../types'

const helpText = `
Enumerate resources to be deployed - will not modify any resources.

Examples
  # Show deployment plan
  sanity blueprints plan
`

const planBlueprintsCommand: CliCommandDefinition = {
  name: 'plan',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'Enumerate resources to be deployed - will not modify any resources',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output

    const client = apiClient({requireUser: true, requireProject: false})
    const {token} = client.config()
    const {
      blueprintsActions: actions,
      utils: {display},
    } = await import('@sanity/runtime-cli')

    const {errors, projectId, stackId, parsedBlueprint, fileInfo} =
      await actions.blueprint.readBlueprintOnDisk({token})

    const {resources} = parsedBlueprint || {resources: []}

    if (errors && errors.length > 0) {
      print(errors)
    }

    if (!projectId) {
      print('Blueprint must contain a project resource')
    }

    const name = stackId || 'Unknown'
    print(`${display.blueprintsFormatting.formatTitle('Blueprint', name)} Plan\n`)
    print(`Blueprint document: (${fileInfo.fileName})`)
    print('')
    print(display.blueprintsFormatting.formatResourceTree(resources))
    print('\nRun `sanity blueprints deploy` to deploy these changes')
  },
}

export default planBlueprintsCommand
