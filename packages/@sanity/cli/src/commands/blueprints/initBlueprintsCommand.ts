import {join} from 'node:path'
import {cwd} from 'node:process'

import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  # Create a new Blueprint manifest file
  sanity blueprints init
`

const initBlueprintsCommand: CliCommandDefinition = {
  name: 'init',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'Initialize a new Blueprint manifest file',
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
      print('No API token found. Please run `sanity login` first.')
      return
    }

    const {blueprint: blueprintAction, projects: projectsAction} = await import(
      '@sanity/runtime-cli/actions/blueprints'
    )

    const existingBlueprint = blueprintAction.findBlueprintFile()

    if (existingBlueprint) {
      print(`A blueprint file already exists: ${existingBlueprint.fileName}`)
      return
    }

    const blueprintExtension = await prompt.single({
      type: 'list',
      message: 'Choose a Blueprint manifest file type:',
      choices: [
        {value: 'json', name: 'JSON (Recommended)'},
        {value: 'js', name: 'JavaScript (Available soon)', disabled: true},
        {value: 'ts', name: 'TypeScript (Available soon)', disabled: true},
      ],
    })

    const {ok, projects, error} = await projectsAction.listProjects({token})

    if (!ok) {
      print(error)
      return
    }

    if (!projects || projects.length === 0) {
      print('No Projects found. Please create a Project in Sanity.io first.')
      return
    }

    const projectChoices = projects.map(({displayName, id}) => ({
      value: id,
      name: `${displayName} <${id}>`,
    }))

    const projectId = await prompt.single({
      type: 'list',
      message: 'Select your Sanity Project:',
      choices: projectChoices,
    })

    const fileName = `blueprint.${blueprintExtension}`
    const filePath = join(cwd(), fileName)

    blueprintAction.writeBlueprintToDisk({
      path: filePath,
      fileType: blueprintExtension as 'json' | 'js' | 'ts',
    })

    blueprintAction.writeConfigFile({projectId})

    print(`Created new blueprint: ./${fileName}`)

    if (blueprintExtension === 'ts') {
      print('\nNote: TypeScript support requires "tsx" to be installed. Run: npm install -D tsx')
    }
  },
}

export default initBlueprintsCommand
