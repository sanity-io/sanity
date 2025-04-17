import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --edit  Edit the configuration

Examples
  # View current configuration
  sanity blueprints config

  # Edit configuration
  sanity blueprints config --edit
`

const defaultFlags = {
  edit: false,
}

const configBlueprintsCommand: CliCommandDefinition = {
  name: 'config',
  group: 'blueprints',
  helpText,
  signature: '[--edit]',
  description: 'View or edit local Blueprints configuration',
  hideFromHelp: true,
  async action(args, context) {
    const {apiClient, output, prompt} = context
    const {print} = output
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    const {
      blueprint: blueprintAction,
      projects: projectsAction,
      stacks: stacksAction,
    } = await import('@sanity/runtime-cli/actions/blueprints')

    const config = blueprintAction.readConfigFile()
    if (!config) {
      print('No configuration found. Run `sanity blueprints init` first.')
      return
    }

    print('\nCurrent configuration:')
    print(JSON.stringify(config, null, 2))

    if (!flags.edit) {
      return
    }

    if (!token) {
      print('No API token found. Please run `sanity login` first.')
      return
    }

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
      default: config.projectId,
    })

    const auth = {token, projectId}

    // get stacks for selected project
    const {ok: stacksOk, stacks, error: stacksError} = await stacksAction.listStacks(auth)
    if (!stacksOk) {
      print(stacksError)
      return
    }

    let stackId
    if (stacks && stacks.length > 0) {
      const stackChoices = stacks.map(({name, id}) => ({
        value: id,
        name: `${name} <${id}>`,
      }))

      stackId = await prompt.single({
        type: 'list',
        message: 'Select a Stack:',
        choices: stackChoices,
        default: config.stackId,
      })
    }

    blueprintAction.writeConfigFile({projectId, stackId})
    print('\nConfiguration updated successfully.')
  },
}

export default configBlueprintsCommand
