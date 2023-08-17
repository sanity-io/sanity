import path from 'path'
import noop from 'lodash/noop'
import type {DatasetAclMode} from '@sanity/client'
import {debug} from '../../debug'
import {writeJson} from '../../util/writeJson'
import {getUserConfig} from '../../util/getUserConfig'
import type {InitFlags} from '../../commands/init/initCommand'
import type {CliCommandArguments, CliCommandContext, SanityJson} from '../../types'
import {createProject} from '../project/createProject'
import {pathExists} from '../../util/pathExists'
import {readJson} from '../../util/readJson'
import {login, LoginFlags} from '../login/login'
import {promptForDatasetName} from './promptForDatasetName'
import {promptForAclMode, promptForDefaultConfig} from './prompts'

/* eslint-disable no-process-env */
const isCI = process.env.CI
/* eslint-enable no-process-env */

// eslint-disable-next-line max-statements, complexity
export async function reconfigureV2Project(
  args: CliCommandArguments<InitFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {output, prompt, workDir, apiClient, yarn, chalk} = context
  const cliFlags = args.extOptions
  const unattended = cliFlags.y || cliFlags.yes
  const print = unattended ? noop : output.print

  let defaultConfig = cliFlags['dataset-default']
  let showDefaultConfigPrompt = !defaultConfig

  let selectedPlan: string | undefined

  // Check if we have a project manifest already
  const manifestPath = path.join(workDir, 'sanity.json')
  let projectManifest = await readJson<SanityJson>(manifestPath)

  // If we are in a Sanity studio project folder and the project manifest has projectId/dataset,
  // ASK if we want to reconfigure. If no projectId/dataset is present, we assume reconfigure
  const hasProjectId = projectManifest && projectManifest.api && projectManifest.api.projectId

  print(`The Sanity Studio in this folder will be tied to a new project on Sanity.io!`)
  if (hasProjectId) {
    print('The previous project configuration will be overwritten.')
  }
  print(`We're first going to make sure you have an account with Sanity.io. Hang on.`)
  print('Press ctrl + C at any time to quit.\n')

  // If the user isn't already authenticated, make it so
  const userConfig = getUserConfig()
  const hasToken = userConfig.get('authToken')

  debug(hasToken ? 'User already has a token' : 'User has no token')

  if (hasToken) {
    print('Looks like you already have a Sanity-account. Sweet!\n')
  } else if (!unattended) {
    await getOrCreateUser()
  }

  const flags = await prepareFlags()

  // We're authenticated, now lets select or create a project
  debug('Prompting user to select or create a project')
  const {projectId, displayName, isFirstProject} = await getOrCreateProject()
  debug(`Project with name ${displayName} selected`)

  // Now let's pick or create a dataset
  debug('Prompting user to select or create a dataset')
  const {datasetName} = await getOrCreateDataset({
    projectId,
    displayName,
    dataset: flags.dataset,
    aclMode: flags.visibility,
    defaultConfig: flags['dataset-default'],
  })

  debug(`Dataset with name ${datasetName} selected`)

  const outputPath = workDir
  let successMessage

  // Rewrite project manifest (sanity.json)
  const projectInfo = projectManifest.project || {}
  const newProps = {
    root: true,
    api: {
      ...(projectManifest.api || {}),
      projectId,
      dataset: datasetName,
    },
    project: {
      ...projectInfo,
      // Keep original name if present
      name: projectInfo.name || displayName,
    },
  }

  // Ensure root, api and project keys are at top to follow sanity.json key order convention
  projectManifest = {
    ...newProps,
    ...projectManifest,
    ...newProps,
  }

  await writeJson(manifestPath, projectManifest)

  const hasNodeModules = await pathExists(path.join(workDir, 'node_modules'))
  if (hasNodeModules) {
    print('Skipping installation of dependencies since node_modules exists.')
    print('Run sanity install to reinstall dependencies')
  } else {
    try {
      await yarn(['install'], {...output, rootDir: workDir})
    } catch (err) {
      throw err
    }
  }

  print(`\n${chalk.green('Success!')} Now what?\n`)

  const isCurrentDir = outputPath === process.cwd()
  if (!isCurrentDir) {
    print(`▪ ${chalk.cyan(`cd ${outputPath}`)}, then:`)
  }

  print(`▪ ${chalk.cyan('sanity docs')} to open the documentation in a browser`)
  print(`▪ ${chalk.cyan('sanity manage')} to open the project settings in a browser`)
  print(`▪ ${chalk.cyan('sanity help')} to explore the CLI manual`)
  print(`▪ ${chalk.green('sanity start')} to run your studio\n`) // v2 uses `start`, not `dev`

  if (successMessage) {
    print(`\n${successMessage}`)
  }

  const sendInvite =
    isFirstProject &&
    (await prompt.single({
      type: 'confirm',
      message:
        'We have an excellent developer community, would you like us to send you an invitation to join?',
      default: true,
    }))

  if (sendInvite) {
    // Intentionally leave the promise "dangling" since we don't want to stall while waiting for this
    apiClient({requireProject: false})
      .request({
        uri: '/invitations/community',
        method: 'POST',
      })
      .catch(noop)
  }

  async function getOrCreateUser() {
    print(`We can't find any auth credentials in your Sanity config`)
    print('- log in or create a new account\n')

    // Provide login options (`sanity login`)
    const {extOptions, ...otherArgs} = args
    const loginArgs: CliCommandArguments<LoginFlags> = {...otherArgs, extOptions: {}}
    await login(loginArgs, context)

    print("Good stuff, you're now authenticated. You'll need a project to keep your")
    print('datasets and collaborators safe and snug.')
  }

  async function getOrCreateProject(): Promise<{
    projectId: string
    displayName: string
    isFirstProject: boolean
  }> {
    let projects
    try {
      projects = await apiClient({requireProject: false}).projects.list({includeMembers: false})
    } catch (err) {
      if (unattended && flags.project) {
        return {projectId: flags.project, displayName: 'Unknown project', isFirstProject: false}
      }

      throw new Error(`Failed to communicate with the Sanity API:\n${err.message}`)
    }

    if (projects.length === 0 && unattended) {
      throw new Error('No projects found for current user')
    }

    if (flags.project) {
      const project = projects.find((proj) => proj.id === flags.project)
      if (!project && !unattended) {
        throw new Error(
          `Given project ID (${flags.project}) not found, or you do not have access to it`,
        )
      }

      return {
        projectId: flags.project,
        displayName: project ? project.displayName : 'Unknown project',
        isFirstProject: false,
      }
    }

    // If the user has no projects or is using a coupon (which can only be applied to new projects)
    // just ask for project details instead of showing a list of projects
    const isUsersFirstProject = projects.length === 0
    if (isUsersFirstProject) {
      debug('No projects found for user, prompting for name')

      const projectName = await prompt.single({type: 'input', message: 'Project name:'})
      return createProject(apiClient, {
        displayName: projectName,
        subscription: selectedPlan ? {planId: selectedPlan} : undefined,
      }).then((response) => ({
        ...response,
        isFirstProject: isUsersFirstProject,
      }))
    }

    debug(`User has ${projects.length} project(s) already, showing list of choices`)

    const projectChoices = projects.map((project) => ({
      value: project.id,
      name: `${project.displayName} [${project.id}]`,
    }))

    const selected = await prompt.single({
      message: 'Select project to use',
      type: 'list',
      choices: [
        {value: 'new', name: 'Create new project'},
        new prompt.Separator(),
        ...projectChoices,
      ],
    })

    if (selected === 'new') {
      debug('User wants to create a new project, prompting for name')
      return createProject(apiClient, {
        displayName: await prompt.single({
          type: 'input',
          message: 'Your project name:',
          default: 'My Sanity Project',
        }),
        subscription: selectedPlan ? {planId: selectedPlan} : undefined,
      }).then((response) => ({
        ...response,
        isFirstProject: isUsersFirstProject,
      }))
    }

    debug(`Returning selected project (${selected})`)
    return {
      projectId: selected,
      displayName: projects.find((proj) => proj.id === selected)?.displayName || '',
      isFirstProject: isUsersFirstProject,
    }
  }

  async function getOrCreateDataset(opts: {
    projectId: string
    displayName: string
    dataset?: string
    aclMode?: string
    defaultConfig?: boolean
  }) {
    if (opts.dataset && isCI) {
      return {datasetName: opts.dataset}
    }

    const client = apiClient({api: {projectId: opts.projectId}})
    const [datasets, projectFeatures] = await Promise.all([
      client.datasets.list(),
      client.request({uri: '/features'}),
    ])

    const privateDatasetsAllowed = projectFeatures.includes('privateDataset')
    const allowedModes = privateDatasetsAllowed ? ['public', 'private'] : ['public']

    if (opts.aclMode && !allowedModes.includes(opts.aclMode)) {
      throw new Error(`Visibility mode "${opts.aclMode}" not allowed`)
    }

    // Getter in order to present prompts in a more logical order
    const getAclMode = async (): Promise<string> => {
      if (opts.aclMode) {
        return opts.aclMode
      }

      if (unattended || !privateDatasetsAllowed || defaultConfig) {
        return 'public'
      }

      if (privateDatasetsAllowed) {
        const mode = await promptForAclMode(prompt, output)
        return mode
      }

      return 'public'
    }

    if (opts.dataset) {
      debug('User has specified dataset through a flag (%s)', opts.dataset)
      const existing = datasets.find((ds) => ds.name === opts.dataset)

      if (!existing) {
        debug('Specified dataset not found, creating it')
        const aclMode = await getAclMode()
        const spinner = context.output.spinner('Creating dataset').start()
        await client.datasets.create(opts.dataset, {aclMode: aclMode as DatasetAclMode})
        spinner.succeed()
      }

      return {datasetName: opts.dataset}
    }

    const datasetInfo =
      'Your content will be stored in a dataset that can be public or private, depending on\nwhether you want to query your content with or without authentication.\nThe default dataset configuration has a public dataset named "production".'

    if (datasets.length === 0) {
      debug('No datasets found for project, prompting for name')
      if (showDefaultConfigPrompt) {
        output.print(datasetInfo)
        defaultConfig = await promptForDefaultConfig(prompt)
      }
      const name = defaultConfig
        ? 'production'
        : await promptForDatasetName(prompt, {
            message: 'Name of your first dataset:',
          })
      const aclMode = await getAclMode()
      const spinner = context.output.spinner('Creating dataset').start()
      await client.datasets.create(name, {aclMode: aclMode as DatasetAclMode})
      spinner.succeed()
      return {datasetName: name}
    }

    debug(`User has ${datasets.length} dataset(s) already, showing list of choices`)
    const datasetChoices = datasets.map((dataset) => ({value: dataset.name}))

    const selected = await prompt.single({
      message: 'Select dataset to use',
      type: 'list',
      choices: [
        {value: 'new', name: 'Create new dataset'},
        new prompt.Separator(),
        ...datasetChoices,
      ],
    })

    if (selected === 'new') {
      const existingDatasetNames = datasets.map((ds) => ds.name)
      debug('User wants to create a new dataset, prompting for name')
      if (showDefaultConfigPrompt && !existingDatasetNames.includes('production')) {
        output.print(datasetInfo)
        defaultConfig = await promptForDefaultConfig(prompt)
      }

      const newDatasetName = defaultConfig
        ? 'production'
        : await promptForDatasetName(
            prompt,
            {
              message: 'Dataset name:',
            },
            existingDatasetNames,
          )
      const aclMode = await getAclMode()
      const spinner = context.output.spinner('Creating dataset').start()
      await client.datasets.create(newDatasetName, {aclMode: aclMode as DatasetAclMode})
      spinner.succeed()
      return {datasetName: newDatasetName}
    }

    debug(`Returning selected dataset (${selected})`)
    return {datasetName: selected}
  }

  async function prepareFlags() {
    const createProjectName = cliFlags['create-project']
    if (cliFlags.dataset || cliFlags.visibility || cliFlags['dataset-default'] || unattended) {
      showDefaultConfigPrompt = false
    }

    if (cliFlags.project && createProjectName) {
      throw new Error(
        'Both `--project` and `--create-project` specified, only a single is supported',
      )
    }

    if (createProjectName === true) {
      throw new Error('Please specify a project name (`--create-project <name>`)')
    }

    if (typeof createProjectName === 'string' && createProjectName.trim().length === 0) {
      throw new Error('Please specify a project name (`--create-project <name>`)')
    }

    if (unattended) {
      debug('Unattended mode, validating required options')
      const requiredForUnattended = ['dataset', 'output-path'] as const
      requiredForUnattended.forEach((flag) => {
        if (!cliFlags[flag]) {
          throw new Error(`\`--${flag}\` must be specified in unattended mode`)
        }
      })

      if (!cliFlags.project && !createProjectName) {
        throw new Error(
          '`--project <id>` or `--create-project <name>` must be specified in unattended mode',
        )
      }
    }

    if (createProjectName) {
      debug('--create-project specified, creating a new project')
      const createdProject = await createProject(apiClient, {
        displayName: createProjectName.trim(),
        subscription: selectedPlan ? {planId: selectedPlan} : undefined,
      })
      debug('Project with ID %s created', createdProject.projectId)

      if (cliFlags.dataset) {
        debug('--dataset specified, creating dataset (%s)', cliFlags.dataset)
        const client = apiClient({api: {projectId: createdProject.projectId}})
        const spinner = context.output.spinner('Creating dataset').start()

        const createBody = cliFlags.visibility
          ? {aclMode: cliFlags.visibility as DatasetAclMode}
          : {}

        await client.datasets.create(cliFlags.dataset, createBody)
        spinner.succeed()
      }

      const newFlags = {...cliFlags, project: createdProject.projectId}
      delete newFlags['create-project']

      return newFlags
    }

    return cliFlags
  }
}
