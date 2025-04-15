import {type CliCommandDefinition} from '../../types'

const helpText = `
Safe to run at any time. Will not modify any Resources.

Examples
  # Show deployment plan
  sanity blueprints plan
`

const planBlueprintsCommand: CliCommandDefinition = {
  name: 'plan',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'Enumerate Resources to be deployed',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output} = context
    const {print} = output

    const client = apiClient({requireUser: true, requireProject: false})
    const {token} = client.config()
    const {blueprint: blueprintAction} = await import('@sanity/runtime-cli/actions/blueprints')
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

    const {errors, projectId, stackId, parsedBlueprint, fileInfo} = blueprint

    if (errors && errors.length > 0) {
      print(errors)
    }

    const resources = parsedBlueprint.resources || []

    if (!projectId) {
      print('Unable to determine Project ID.')
      print('To configure this Blueprint, run `sanity blueprints config`')
      // continue to show the plan
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
