import {join} from 'node:path'
import {cwd} from 'node:process'

import {type CliCommandDefinition} from '../../types'

const helpText = `
Initialize a new Blueprint file.

Examples
  # Create a new blueprint
  sanity blueprints init
`

const initBlueprintsCommand: CliCommandDefinition = {
  name: 'init',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'Initialize a new Blueprint',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output, prompt} = context
    const {print} = output

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()

    if (!token) {
      print('No API token found. Please set a token using `sanity login` first.')
      return
    }

    const {blueprintsActions: actions} = await import('@sanity/runtime-cli')

    const existingBlueprint = actions.blueprint.findBlueprintFile()

    if (existingBlueprint) {
      print(`A blueprint file already exists: ${existingBlueprint.fileName}`)
      return
    }

    const blueprintExtension = await prompt.single({
      type: 'list',
      message: 'Choose a blueprint type:',
      choices: [
        {value: 'json', name: 'JSON (Recommended)'},
        {value: 'js', name: 'JavaScript (Beta)'},
        {value: 'ts', name: 'TypeScript (Alpha)'},
      ],
    })

    const {ok, projects, error} = await actions.projects.listProjects({token})

    if (!ok) {
      print(error)
      return
    }

    if (!projects || projects.length === 0) {
      print('No projects found. Please create a project in Sanity.io first.')
      return
    }

    const projectChoices = projects.map(({displayName, id}) => ({
      value: id,
      name: `${displayName} <${id}>`,
    }))

    const projectId = await prompt.single({
      type: 'list',
      message: 'Select your Sanity project:',
      choices: projectChoices,
    })

    const fileName = `blueprint.${blueprintExtension}`
    const filePath = join(cwd(), fileName)

    actions.blueprint.writeBlueprintToDisk({
      path: filePath,
      fileType: blueprintExtension as 'json' | 'js' | 'ts',
    })

    actions.blueprint.writeConfigFile({projectId})

    print(`Created new blueprint: ./${fileName}`)

    if (blueprintExtension === 'ts') {
      print('\nNote: TypeScript support requires "tsx" to be installed. Run: npm install -D tsx')
    }
  },
}

export default initBlueprintsCommand
