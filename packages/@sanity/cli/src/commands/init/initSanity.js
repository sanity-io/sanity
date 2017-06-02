import resolveFrom from 'resolve-from'
import debug from '../../debug'
import getUserConfig from '../../util/getUserConfig'
import getProjectDefaults from '../../util/getProjectDefaults'
import createProvisionalUser from '../../actions/user/createProvisionalUser'
import createProject from '../../actions/project/createProject'
import login from '../../actions/login/login'
import promptForDatasetName from './promptForDatasetName'
import gatherInput from './gatherInput'
import bootstrapTemplate from './bootstrapTemplate'

export default async function initSanity(args, context) {
  const {output, prompt, workDir, apiClient, yarn, chalk} = context
  output.print('This utility walks you through creating a Sanity installation.')
  output.print('Press ^C at any time to quit.\n')

  // If the user isn't already authenticated, make it so
  const userConfig = getUserConfig()
  const hasToken = userConfig.get('authToken')
  const authType = userConfig.get('authType')
  let isProvisional = authType === 'provisional'
  debug(hasToken ? 'User already has a token' : 'User has no token')

  if (hasToken && isProvisional) {
    output.print("We found some temporary auth credentials in your Sanity config - we're gonna use")
    output.print('those, but make sure to claim your account before it expires!\n')
  } else if (hasToken) {
    output.print('Looks like you already have a Sanity-account. Sweet!\n')
  }

  if (!hasToken) {
    const user = await getOrCreateUser()
    isProvisional = user.isProvisional
  }

  // We're authenticated, now lets create a project
  debug('Prompting user to select or create a project')
  const {projectId, displayName} = await getOrCreateProject()
  const sluggedName = displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9]/g, '')
  debug(`Project with name ${displayName} selected`)

  // Now let's pick or create a dataset
  debug('Prompting user to select or create a dataset')
  const {datasetName} = await getOrCreateDataset({projectId, displayName})
  debug(`Dataset with name ${datasetName} selected`)

  // Gather project defaults based on environment
  const defaults = await getProjectDefaults(workDir, {isPlugin: false})

  // Prompt the user for required information
  const answers = await gatherInput(prompt, defaults, {workDir, sluggedName})

  // Ensure we are using the output path provided by user
  const outputPath = answers.outputPath || workDir

  // Build a full set of resolved options
  const initOptions = {
    template: 'moviedb',
    outputDir: outputPath,
    name: sluggedName,
    displayName: displayName,
    dataset: datasetName,
    projectId: projectId,
    provisionalToken: isProvisional && getUserConfig().get('authToken'),
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
  const coreCommands = require(resolveFrom(outputPath, '@sanity/core')).commands
  const configCheckCmd = coreCommands.find(cmd => cmd.name === 'configcheck')
  await configCheckCmd.action({extOptions: {quiet: true}}, Object.assign({}, context, {
    workDir: outputPath
  }))

  // Check if we're currently in the output path, so we can give a better start message
  if (outputPath === process.cwd()) {
    output.print(`\n${chalk.green('Success!')} You can now run "${chalk.cyan('sanity start')}"`)
  } else {
    output.print(`\n${chalk.green('Success!')} You can now change to directory "${chalk.cyan(outputPath)}" and run "${chalk.cyan('sanity start')}"`)
  }

  // See if the template has a success message handler and print it
  const successMessage = template.getSuccessMessage ? template.getSuccessMessage(initOptions, context) : ''
  if (successMessage) {
    output.print(`\n${successMessage}`)
  }

  // Create a provisional user and store the token
  async function getOrCreateUser() {
    output.print("We can't find any auth credentials in your Sanity config - looks like you")
    output.print("haven't used Sanity on this system before?\n")
    //output.print("If you're looking to try out Sanity and haven't registered we can just set up")
    //output.print('a temp account for testing. You can always claim it later.\n')

    // Provide login options (temporarily disabled until claiming provisional accounts is in place)
    /*
    const authMethod = await prompt.single({
      message: 'Create temporary account?',
      type: 'list',
      choices: [
        {value: 'provisional', name: 'A temp account sounds great'},
        {value: 'login', name: 'Sign in using a Google or Github account'},
        {value: 'arrow', name: 'I took an arrow to the knee'}
      ]
    })
    */
    const authMethod = 'login'

    if (authMethod === 'arrow') {
      output.print("Cool story about the arrow, guess you're in a hurry. Here's a temp account.")
    }

    if (authMethod === 'arrow' || authMethod === 'provisional') {
      try {
        const {token} = await createProvisionalUser(apiClient)
        getUserConfig().set({
          authToken: token,
          authType: 'provisional'
        })

        if (!token) {
          throw new Error('No token received from server')
        }
      } catch (err) {
        const userError = new Error('Failed to create provisional user')
        userError.details = err
        throw userError
      }

      output.print("Good stuff, you now have a token for a temporary account. You'll also need")
      output.print('a project to keep your data sets and collaborators safe and snug')

      return Promise.resolve({isProvisional: true})
    }

    // Provide login options (`sanity login`)
    await login(args, context)

    output.print("Good stuff, you're now authenticated. You'll need a project to keep your")
    output.print('data sets and collaborators safe and snug.')
    return Promise.resolve({isProvisional: false})
  }

  async function getOrCreateProject() {
    let projects
    try {
      projects = await apiClient({requireProject: false}).projects.list()
    } catch (err) {
      throw new Error(`Failed to communicate with the Sanity API:\n${err.message}`)
    }

    if (projects.length === 0) {
      debug('No projects found for user, prompting for name')
      const projectName = await prompt.single({message: 'Informal name for your project'})
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
      choices: [
        {value: 'new', name: 'Create new project'},
        new prompt.Separator(),
        ...projectChoices
      ]
    })

    if (selected === 'new') {
      debug('User wants to create a new project, prompting for name')
      return createProject(apiClient, {
        displayName: await prompt.single({message: 'Informal name for your project'})
      })
    }

    debug(`Returning selected project (${selected})`)
    return {
      projectId: selected,
      displayName: projects.find(proj => proj.id === selected).displayName
    }
  }

  async function getOrCreateDataset(opts) {
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
      choices: [
        {value: 'new', name: 'Create new dataset'},
        new prompt.Separator(),
        ...datasetChoices
      ]
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
