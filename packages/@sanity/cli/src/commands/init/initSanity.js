import path from 'path'
import resolveFrom from 'resolve-from'
import deburr from 'lodash/deburr'
import noop from 'lodash/noop'
import debug from '../../debug'
import getUserConfig from '../../util/getUserConfig'
import getProjectDefaults from '../../util/getProjectDefaults'
import createProject from '../../actions/project/createProject'
import login from '../../actions/login/login'
import promptForDatasetName from './promptForDatasetName'
import gatherInput from './gatherInput'
import bootstrapTemplate from './bootstrapTemplate'

export default async function initSanity(args, context) {
  const flags = args.extOptions
  const {output, prompt, workDir, apiClient, yarn, chalk} = context
  const unattended = flags.y || flags.yes
  const print = unattended ? noop : output.print

  const requiredForUnattended = ['project', 'dataset', 'output-path']
  if (unattended) {
    requiredForUnattended.forEach(flag => {
      if (!flags[flag]) {
        throw new Error(`\`--${flag}\` must be specified in unattended mode`)
      }
    })
  }

  print('This utility walks you through creating a Sanity installation.')
  print('Press ^C at any time to quit.\n')

  // If the user isn't already authenticated, make it so
  const userConfig = getUserConfig()
  const hasToken = userConfig.get('authToken')

  debug(hasToken ? 'User already has a token' : 'User has no token')

  if (hasToken) {
    print('Looks like you already have a Sanity-account. Sweet!\n')
  } else if (!unattended) {
    await getOrCreateUser()
  }

  // We're authenticated, now lets create a project
  debug('Prompting user to select or create a project')
  const {projectId, displayName} = await getOrCreateProject()
  const sluggedName = deburr(displayName.toLowerCase())
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9]/g, '')

  debug(`Project with name ${displayName} selected`)

  // Now let's pick or create a dataset
  debug('Prompting user to select or create a dataset')
  const {datasetName} = await getOrCreateDataset({
    projectId,
    displayName,
    dataset: flags.dataset
  })

  debug(`Dataset with name ${datasetName} selected`)

  // Gather project defaults based on environment
  const defaults = await getProjectDefaults(workDir, {isPlugin: false, context})

  // Prompt the user for required information
  let answers
  if (unattended) {
    answers = Object.assign({license: 'UNLICENSED'}, defaults, {
      outputPath: path.resolve(flags['output-path'])
    })
  } else {
    answers = await gatherInput(prompt, defaults, {workDir, sluggedName})
  }

  // Ensure we are using the output path provided by user
  const outputPath = answers.outputPath || workDir

  // Prompt for template to use
  const defaultTemplate = unattended ? flags.template || 'clean' : null
  const templateName = defaultTemplate || await prompt.single({
    message: 'Select project template',
    type: 'list',
    choices: [
      {
        value: 'moviedb',
        name: 'Movie database (schema + sample data)'
      },
      {
        value: 'clean',
        name: 'Clean, minimal project'
      }
    ]
  })

  // Build a full set of resolved options
  const initOptions = {
    template: templateName,
    outputDir: outputPath,
    name: sluggedName,
    displayName: displayName,
    dataset: datasetName,
    projectId: projectId,
    ...answers
  }

  // Bootstrap Sanity, creating required project files, manifests etc
  const template = await bootstrapTemplate(initOptions, context)

  // Now for the slow part... installing dependencies
  try {
    await yarn(['install'], {...output, rootDir: outputPath})
  } catch (err) {
    throw err
  }

  // Make sure we have the required configs
  const coreCommands = require(resolveFrom.silent(outputPath, '@sanity/core')).commands
  const configCheckCmd = coreCommands.find(cmd => cmd.name === 'configcheck')
  await configCheckCmd.action(
    {extOptions: {quiet: true}},
    Object.assign({}, context, {
      workDir: outputPath
    })
  )

  // Check if we're currently in the output path, so we can give a better start message
  if (outputPath === process.cwd()) {
    print(`\n${chalk.green('Success!')} You can now run "${chalk.cyan('sanity start')}"`)
  } else {
    print(
      `\n${chalk.green('Success!')} You can now change to directory "${chalk.cyan(
        outputPath
      )}" and run "${chalk.cyan('sanity start')}"`
    )
  }

  // See if the template has a success message handler and print it
  const successMessage = template.getSuccessMessage
    ? template.getSuccessMessage(initOptions, context)
    : ''

  if (successMessage) {
    print(`\n${successMessage}`)
  }

  print('\nNeed some help to get you started? Run "sanity docs" for documentation!\n')

  async function getOrCreateUser() {
    print("We can't find any auth credentials in your Sanity config - looks like you")
    print("haven't used Sanity on this system before?\n")

    // Provide login options (`sanity login`)
    await login(args, context)

    print("Good stuff, you're now authenticated. You'll need a project to keep your")
    print('data sets and collaborators safe and snug.')
  }

  async function getOrCreateProject() {
    let projects
    try {
      projects = await apiClient({requireProject: false}).projects.list()
    } catch (err) {
      if (unattended) {
        return {projectId: flags.project, displayName: 'Unknown project'}
      }

      throw new Error(`Failed to communicate with the Sanity API:\n${err.message}`)
    }

    if (projects.length === 0 && unattended) {
      throw new Error('No projects found for current user')
    }

    if (unattended) {
      const project = projects.find(proj => proj.id === flags.project)
      return {
        projectId: flags.project,
        displayName: project ? project.displayName : 'Unknown project'
      }
    }

    if (projects.length === 0) {
      debug('No projects found for user, prompting for name')
      const projectName = await prompt.single({message: 'Project name'})
      return createProject(apiClient, {displayName: projectName})
    }

    debug(`User has ${projects.length} project(s) already, showing list of choices`)

    const projectChoices = projects.map(project => ({
      value: project.id,
      name: `${project.displayName} [${project.id}]`
    }))

    const selected = await prompt.single({
      message: 'Select project to use',
      type: 'list',
      choices: [{value: 'new', name: 'Create new project'}, new prompt.Separator(), ...projectChoices]
    })

    if (selected === 'new') {
      debug('User wants to create a new project, prompting for name')
      return createProject(apiClient, {
        displayName: await prompt.single({
          message: 'Informal name for your project'
        })
      })
    }

    debug(`Returning selected project (${selected})`)
    return {
      projectId: selected,
      displayName: projects.find(proj => proj.id === selected).displayName
    }
  }

  async function getOrCreateDataset(opts) {
    if (unattended) {
      return {datasetName: opts.dataset}
    }

    const client = apiClient({api: {projectId: opts.projectId}})
    const datasets = await client.datasets.list()

    if (datasets.length === 0) {
      debug('No datasets found for project, prompting for name')
      const name = await promptForDatasetName(prompt, {
        message: 'Name of your first data set:',
        default: 'production'
      })

      await client.datasets.create(name)
      return {datasetName: name}
    }

    debug(`User has ${datasets.length} dataset(s) already, showing list of choices`)
    const datasetChoices = datasets.map(dataset => ({value: dataset.name}))

    const selected = await prompt.single({
      message: 'Select dataset to use',
      type: 'list',
      choices: [{value: 'new', name: 'Create new dataset'}, new prompt.Separator(), ...datasetChoices]
    })

    if (selected === 'new') {
      debug('User wants to create a new dataset, prompting for name')
      const newDatasetName = await promptForDatasetName(prompt, {
        message: 'Name your data set:',
        default: 'production'
      })
      await client.datasets.create(newDatasetName)
      return {datasetName: newDatasetName}
    }

    debug(`Returning selected dataset (${selected})`)
    return {datasetName: selected}
  }
}
