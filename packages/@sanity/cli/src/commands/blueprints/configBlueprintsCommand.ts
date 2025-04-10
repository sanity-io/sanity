import {type CliCommandDefinition} from '../../types'

const helpText = `
View or edit Blueprint configuration.

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
  description: 'View or edit Blueprint configuration',
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
    const {blueprintsActions: actions} = await import('@sanity/runtime-cli')

    const config = actions.blueprint.readConfigFile()
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
      print('No API token found. Please set a token using `sanity login` first.')
      return
    }

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
      default: config.projectId,
    })

    const auth = {token, projectId}

    // get stacks for selected project
    const {ok: stacksOk, stacks, error: stacksError} = await actions.stacks.listStacks(auth)
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
        message: 'Select a stack:',
        choices: stackChoices,
        default: config.stackId,
      })
    }

    actions.blueprint.writeConfigFile({projectId, stackId})
    print('\nConfiguration updated successfully.')
  },
}

export default configBlueprintsCommand
