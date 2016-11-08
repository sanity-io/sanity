import debug from '../../debug'
import getUserConfig from '../../util/getUserConfig'
import getProjectDefaults from '../../util/getProjectDefaults'
import resolveLatestVersions from '../../util/resolveLatestVersions'
import createProvisionalUser from '../../actions/user/createProvisionalUser'
import createProject from '../../actions/project/createProject'
import login from '../../actions/login/login'
import versionRanges from '../../versionRanges'
import promptForDatasetName from './promptForDatasetName'
import gatherInput from './gatherInput'
import {bootstrapSanity} from './bootstrap'

export default async function initSanity(args, context) {
  const {output, prompt, workDir, apiClient, yarn} = context
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

  // Find latest versions of dependencies
  const spinner = output.spinner('Resolving latest module versions').start()
  const dependencies = await resolveLatestVersions(
    Object.keys(versionRanges.core),
    {asRange: true}
  )
  spinner.succeed()

  // Bootstrap Sanity, creating required project files, manifests etc
  await bootstrapSanity(outputPath, {
    name: sluggedName,
    displayName: displayName,
    dataset: datasetName,
    projectId: projectId,
    provisionalToken: isProvisional && getUserConfig().get('authToken'),
    dependencies,
    ...answers
  }, output)

  // Now for the slow part... installing dependencies
  try {
    await yarn(['install'], {...output, rootDir: outputPath})
  } catch (err) {
    throw err
  }

  // Check if we're currently in the output path, so we can give a better start message
  if (outputPath === process.cwd()) {
    output.print('Success! You can now run `sanity start`')
  } else {
    output.print(`Success! You can now change to directory ${outputPath} and run \`sanity start\``)
  }


  // Create a provisional user and store the token
  async function getOrCreateUser() {
    output.print("We can't find any auth credentials in your Sanity config - looks like you")
    output.print("haven't used Sanity on this system before?\n")
    output.print("If you're looking to try out Sanity and haven't registered we can just set up")
    output.print('a temp account for testing. You can always claim it later.\n')

    // Provide login options
    const authMethod = await prompt.single({
      message: 'Create temporary account?',
      type: 'list',
      choices: [
        {value: 'provisional', name: 'A temp account sounds swell'},
        {value: 'login', name: 'No, I already have an account'},
        {value: 'arrow', name: 'I took an arrow to the knee'}
      ]
    })

    if (authMethod === 'arrow') {
      output.print("Cool story bout the arrow, guess you're in a hurry. Creating temp account.")
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
    const projects = await apiClient({requireProject: false}).projects.list()

    if (projects.length === 0) {
      debug('No projects found for user, prompting for name')
      const projectName = await prompt.single({message: 'Informal name for your project'})
      return await createProject(apiClient, {displayName: projectName})
    }

    debug(`User has ${projects.length} project(s) already, showing list of choices`)

    const projectChoices = projects.map(project => ({
      value: project.projectId,
      name: `${project.displayName} [${project.projectId}]`
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
      return await createProject(apiClient, {
        displayName: await prompt.single({message: 'Informal name for your project'})
      })
    }

    debug(`Returning selected project (${selected})`)
    return {
      projectId: selected,
      displayName: projects.find(proj => proj.projectId === selected).displayName
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
        message: 'Name of your first data set:',
        default: 'production'
      })
      await client.datasets.create(newDatasetName)
      return {datasetName: newDatasetName}
    }

    debug(`Returning selected dataset (${selected})`)
    return {datasetName: selected}
  }
}

