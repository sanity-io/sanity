import {type CliCommandDefinition} from '../../types'

const helpText = `
Arguments
  [type]  Type of Resource to add (currently only 'function' is supported)

Examples
  # Add a Function Resource
  sanity blueprints add function
`

const addBlueprintsCommand: CliCommandDefinition = {
  name: 'add',
  group: 'blueprints',
  helpText,
  signature: '<type>',
  description: 'Add a Resource to a Blueprint',
  hideFromHelp: true,
  async action(args, context) {
    const {output, prompt} = context
    const {print} = output

    const [resourceType] = args.argsWithoutOptions

    if (!resourceType) {
      print('Resource type is required. Available types: function')
      return
    }

    const {blueprintsActions: actions} = await import('@sanity/runtime-cli')

    const existingBlueprint = actions.blueprint.findBlueprintFile()
    if (!existingBlueprint) {
      print('No blueprint file found. Run `sanity blueprints init` first.')
      return
    }

    if (resourceType === 'function') {
      const functionName = await prompt.single({
        type: 'input',
        message: 'Enter function name:',
        validate: (input: string) => input.length > 0 || 'Function name is required',
      })

      const functionType = await prompt.single({
        type: 'list',
        message: 'Choose function type:',
        choices: [
          {value: 'document-mutation', name: 'Document Mutation'},
          {value: 'document-publish', name: 'Document Publish'},
          {value: 'document-update', name: 'Document Update'},
          {value: 'document-delete', name: 'Document Delete'},
        ],
      })

      const {filePath, resourceAdded, resource} = actions.resources.createFunctionResource({
        name: functionName,
        type: functionType,
        displayName: functionName,
      })

      print(`\nCreated function: ${filePath}`)

      if (resourceAdded) {
        // added to blueprint.json
        print('Function Resource added to Blueprint')
      } else {
        // print the resource JSON for manual addition
        print('\nAdd this Function Resource to your Blueprint:')
        print(JSON.stringify(resource, null, 2))
      }

      return
    }

    print(`Unsupported resource type: ${resourceType}. Available types: function`)
  },
}

export default addBlueprintsCommand
