import path from 'path'
import fse from 'fs-extra'
import pFilter from 'p-filter'
import resolveFrom from 'resolve-from'
import deburr from 'lodash/deburr'
import noop from 'lodash/noop'
import {loadJson} from '@sanity/util/_internal'
import type {DatasetAclMode} from '@sanity/client'
import {reduceConfig} from '@sanity/util'
import {debug} from '../../debug'
import {getClientWrapper} from '../../util/clientWrapper'
import {getUserConfig} from '../../util/getUserConfig'
import {getProjectDefaults, ProjectDefaults} from '../../util/getProjectDefaults'
import type {
  CliApiClient,
  CliCommandArguments,
  CliCommandContext,
  CliCommandDefinition,
  SanityJson,
} from '../../types'
import {createProject} from '../project/createProject'
import {login, LoginFlags} from '../login/login'
import {dynamicRequire} from '../../util/dynamicRequire'
import {promptForDatasetName} from './promptForDatasetName'
import bootstrapTemplate from './bootstrapTemplate'
import templates from './templates'
import {reconfigureV2Project} from './reconfigureV2Project'
import {validateEmptyPath, absolutify} from './fsUtils'
import {promptForAclMode, promptForDefaultConfig, promptImplicitReconfigure} from './prompts'

/* eslint-disable no-process-env */
const isCI = process.env.CI
const sanityEnv = process.env.SANITY_INTERNAL_ENV
const environment = sanityEnv ? sanityEnv : process.env.NODE_ENV
/* eslint-enable no-process-env */

export interface InitProjectFlags {
  y?: boolean
  yes?: boolean
  project?: string
  dataset?: string
  template?: string
  visibility?: string

  'output-path'?: string
  'project-plan'?: string
  'create-project'?: boolean | string
  'dataset-default'?: boolean

  coupon?: string
  reconfigure?: boolean

  organization?: string
}

export type InitOptions = {
  template: string
  outputDir: string
  name: string
  displayName: string
  dataset: string
  projectId: string
} & (
  | ({
      license: string
    } & ProjectDefaults & {
        outputPath: string | undefined
      })
  | {
      description: string | undefined
      gitRemote: string | undefined
      author: string | undefined
      license: string
      outputPath: string | undefined
    }
)

export interface ProjectTemplate {
  datasetUrl?: string
  dependencies?: Record<string, string>
  importPrompt?: string
  generateSanityManifest: (base: SanityJson, options: InitOptions) => SanityJson
  getSuccessMessage?: (initOptions: InitOptions, context: CliCommandContext) => string
}

export interface ProjectOrganization {
  id: string
  name: string
  slug: string
}

// eslint-disable-next-line max-statements, complexity
export default async function initSanity(
  args: CliCommandArguments<InitProjectFlags>,
  context: CliCommandContext
): Promise<void> {
  const {output, prompt, workDir, apiClient, yarn, chalk, sanityMajorVersion} = context
  const cliFlags = args.extOptions
  const unattended = cliFlags.y || cliFlags.yes
  const print = unattended ? noop : output.print
  const specifiedOutputPath = cliFlags['output-path']
  const intendedPlan = cliFlags['project-plan']
  const intendedCoupon = cliFlags.coupon

  let reconfigure = cliFlags.reconfigure
  let defaultConfig = cliFlags['dataset-default']
  let showDefaultConfigPrompt = !defaultConfig

  if (sanityMajorVersion === 2) {
    await reconfigureV2Project(args, context)
    return
  }

  // Only allow either --project-plan or --coupon
  if (intendedCoupon && intendedPlan) {
    throw new Error(
      'Error! --project-plan and --coupon cannot be used together; please select only one flag'
    )
  }

  // Don't allow --coupon and --project
  if (intendedCoupon && cliFlags.project) {
    throw new Error(
      'Error! --project and --coupon cannot be used together; coupons can only be applied to new projects'
    )
  }

  let selectedPlan: string | undefined
  if (intendedCoupon) {
    try {
      selectedPlan = await getPlanFromCoupon(apiClient, intendedCoupon)
      print(`Coupon "${intendedCoupon}" validated!\n`)
    } catch (err) {
      throw new Error(`Unable to validate coupon code "${intendedCoupon}":\n\n${err.message}`)
    }
  } else if (intendedPlan) {
    selectedPlan = intendedPlan
  }

  // Check if we have a project manifest already
  const manifestPath = path.join(workDir, 'sanity.json')
  let inProjectContext = false
  let projectManifest
  try {
    projectManifest = await fse.readJson(manifestPath)
    inProjectContext = Boolean(projectManifest.root)
  } catch (err) {
    // Intentional noop
  }

  const toDifferentPath = specifiedOutputPath && absolutify(specifiedOutputPath) !== workDir

  // If explicitly reconfiguring, make sure we have something to reconfigure
  if (reconfigure && !inProjectContext) {
    throw new Error(
      projectManifest
        ? 'Reconfigure flag passed, but no `sanity.json` found'
        : 'Reconfigure flag passed, but `sanity.json` does not have "root" property set'
    )
  }

  // If we are in a Sanity studio project folder and the project manifest has projectId/dataset,
  // ASK if we want to reconfigure. If no projectId/dataset is present, we assume reconfigure
  const hasProjectId = projectManifest && projectManifest.api && projectManifest.api.projectId
  if (!toDifferentPath && hasProjectId && !reconfigure) {
    reconfigure = await promptImplicitReconfigure(prompt)
    if (!reconfigure) {
      print(
        'Init cancelled. If you want to create a new project, try running `sanity init` in an empty folder'
      )
      return
    }
  } else if (!toDifferentPath) {
    reconfigure = inProjectContext
  }

  if (reconfigure) {
    print(`The Sanity Studio in this folder will be tied to a new project on Sanity.io!`)
    if (hasProjectId) {
      print('The previous project configuration will be overwritten.')
    }
    print(`We're first going to make sure you have an account with Sanity.io. Hang on.`)
    print('Press ctrl + C at any time to quit.\n')
  } else {
    print(`You're setting up a Sanity.io project!`)
    print(`We'll make sure you're logged in with Sanity.io.`)
    print(`Then, we'll install a Sanity Studio for your project.\n`)
    print('Press ctrl + C at any time to quit.\n')
  }

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
  const sluggedName = deburr(displayName.toLowerCase())
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

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

  let outputPath = workDir
  let successMessage
  let defaults: ProjectDefaults | undefined

  if (reconfigure) {
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

    await fse.outputJSON(manifestPath, projectManifest, {spaces: 2})

    const hasNodeModules = await fse.pathExists(path.join(workDir, 'node_modules'))
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
  } else {
    // Gather project defaults based on environment
    defaults = await getProjectDefaults(workDir, {isPlugin: false, context})

    // Prompt the user for required information
    const answers = await getProjectInfo()

    // Ensure we are using the output path provided by user
    outputPath = answers.outputPath || workDir

    // Prompt for template to use
    const templateName = await selectProjectTemplate()

    // Build a full set of resolved options
    const initOptions = {
      template: templateName,
      outputDir: outputPath,
      name: sluggedName,
      displayName: displayName,
      dataset: datasetName,
      projectId: projectId,
      ...answers,
    }

    const template = templates[templateName]
    if (!template) {
      throw new Error(`Template "${templateName}" not found`)
    }

    // If the template has a sample dataset, prompt the user whether or not we should import it
    const shouldImport =
      !unattended && template.datasetUrl && (await promptForDatasetImport(template.importPrompt))

    // Bootstrap Sanity, creating required project files, manifests etc
    await bootstrapTemplate(initOptions, context)

    // Now for the slow part... installing dependencies
    try {
      await yarn(['install'], {...output, rootDir: outputPath})
    } catch (err) {
      throw err
    }

    // Make sure we have the required configs
    const corePath = resolveFrom.silent(outputPath, '@sanity/core') || 'null'

    debug('@sanity/core path resolved to %s', corePath)
    debug('(from %s)', outputPath)
    const coreModule = dynamicRequire(corePath)
    const coreCommands = coreModule && coreModule.commands

    if (!Array.isArray(coreCommands)) {
      throw new Error('@sanity/core module failed to be resolved')
    }

    // Prompt for dataset import (if a dataset is defined)
    if (shouldImport) {
      await doDatasetImport({
        outputPath,
        coreCommands,
        template,
        datasetName,
        context,
      })

      print('')
      print('If you want to delete the imported data, use')
      print(`\t${chalk.cyan(`sanity dataset delete ${datasetName}`)}`)
      print('and create a new clean dataset with')
      print(`\t${chalk.cyan(`sanity dataset create <name>`)}\n`)
    }

    // See if the template has a success message handler and print it
    successMessage = template.getSuccessMessage
      ? template.getSuccessMessage(initOptions, context)
      : ''
  }

  const isCurrentDir = outputPath === process.cwd()
  if (isCurrentDir) {
    print(`\n${chalk.green('Success!')} Now, use this command to continue:\n`)
    print(`${chalk.cyan('sanity start')} - to run Sanity Studio\n`)
  } else {
    print(`\n${chalk.green('Success!')} Now, use these commands to continue:\n`)
    print(`First: ${chalk.cyan(`cd ${outputPath}`)} - to enter project’s directory`)
    print(`Then: ${chalk.cyan('sanity start')} - to run Sanity Studio\n`)
  }

  print(`Other helpful commands`)
  print(`sanity docs - to open the documentation in a browser`)
  print(`sanity manage - to open the project settings in a browser`)
  print(`sanity help - to explore the CLI manual`)

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
    let organizations: ProjectOrganization[]
    try {
      const client = apiClient({requireUser: true, requireProject: false})
      const [allProjects, allOrgs] = await Promise.all([
        client.projects.list(),
        client.request({uri: '/organizations'}),
      ])
      projects = allProjects
      organizations = allOrgs
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
          `Given project ID (${flags.project}) not found, or you do not have access to it`
        )
      }

      return {
        projectId: flags.project,
        displayName: project ? project.displayName : 'Unknown project',
        isFirstProject: false,
      }
    }

    if (flags.organization) {
      const organization =
        organizations.find((org) => org.id === flags.organization) ||
        organizations.find((org) => org.slug === flags.organization)

      if (!organization) {
        throw new Error(
          `Given organization ID (${flags.organization}) not found, or you do not have access to it`
        )
      }

      if (!(await hasProjectAttachGrant(flags.organization))) {
        throw new Error(
          'You lack the necessary permissions to attach a project to this organization'
        )
      }
    }

    // If the user has no projects or is using a coupon (which can only be applied to new projects)
    // just ask for project details instead of showing a list of projects
    const isUsersFirstProject = projects.length === 0
    if (isUsersFirstProject || intendedCoupon) {
      debug(
        isUsersFirstProject
          ? 'No projects found for user, prompting for name'
          : 'Using a coupon - skipping project selection'
      )

      const projectName = await prompt.single({type: 'input', message: 'Project name:'})
      return createProject(apiClient, {
        displayName: projectName,
        organizationId: await getOrganizationId(organizations),
        subscription: selectedPlan ? {planId: selectedPlan} : undefined,
        metadata: {coupon: intendedCoupon},
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
        organizationId: await getOrganizationId(organizations),
        subscription: selectedPlan ? {planId: selectedPlan} : undefined,
        metadata: {coupon: intendedCoupon},
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
            existingDatasetNames
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

  function promptForDatasetImport(message?: string) {
    return prompt.single({
      type: 'confirm',
      message: message || 'This template includes a sample dataset, would you like to use it?',
      default: true,
    })
  }

  function selectProjectTemplate() {
    const defaultTemplate = unattended || flags.template ? flags.template || 'clean' : null
    if (defaultTemplate) {
      return defaultTemplate
    }

    return prompt.single({
      message: 'Select project template',
      type: 'list',
      choices: [
        {
          value: 'moviedb',
          name: 'Movie project (schema + sample data)',
        },
        {
          value: 'ecommerce',
          name: 'E-commerce (schema + sample data)',
        },
        {
          value: 'blog',
          name: 'Blog (schema)',
        },
        {
          value: 'clean',
          name: 'Clean project with no predefined schemas',
        },
      ],
    })
  }

  async function getProjectInfo() {
    const specifiedPath = flags['output-path'] && path.resolve(flags['output-path'])

    if (unattended) {
      return Object.assign({license: 'UNLICENSED'}, defaults, {
        outputPath: specifiedPath,
      })
    }

    const workDirIsEmpty = (await fse.readdir(workDir)).length === 0
    return {
      description: defaults?.description,
      gitRemote: defaults?.gitRemote,
      author: defaults?.author,
      license: 'UNLICENSED',

      outputPath:
        specifiedPath ||
        (await prompt.single({
          type: 'input',
          message: 'Project output path:',
          default: workDirIsEmpty ? workDir : path.join(workDir, sluggedName),
          validate: validateEmptyPath,
          filter: absolutify,
        })),
    }
  }

  async function prepareFlags() {
    const createProjectName = cliFlags['create-project']
    if (cliFlags.dataset || cliFlags.visibility || cliFlags['dataset-default'] || unattended) {
      showDefaultConfigPrompt = false
    }

    if (cliFlags.project && createProjectName) {
      throw new Error(
        'Both `--project` and `--create-project` specified, only a single is supported'
      )
    }

    if (cliFlags.project && cliFlags.organization) {
      throw new Error(
        'You have specified both a project and an organization. To move a project to an organization please visit https://www.sanity.io/manage'
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
          '`--project <id>` or `--create-project <name>` must be specified in unattended mode'
        )
      }
    }

    if (createProjectName) {
      debug('--create-project specified, creating a new project')
      const createdProject = await createProject(apiClient, {
        displayName: createProjectName.trim(),
        organizationId: cliFlags.organization || undefined,
        subscription: selectedPlan ? {planId: selectedPlan} : undefined,
        metadata: {coupon: intendedCoupon},
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

      const newFlags = Object.assign({}, cliFlags, {project: createdProject.projectId})
      delete newFlags['create-project']

      return newFlags
    }

    return cliFlags
  }

  async function getOrganizationId(organizations: ProjectOrganization[]) {
    let organizationId = flags.organization
    if (unattended) {
      return organizationId || undefined
    }

    const shouldPrompt = organizations.length > 0 && !organizationId
    if (shouldPrompt) {
      debug(`User has ${organizations.length} organization(s), checking attach access`)
      const withGrant = await getOrganizationsWithAttachGrant(organizations)
      if (withGrant.length === 0) {
        debug('User lacks project attach grant in all organizations, not prompting')
        return undefined
      }

      debug('User has attach access to %d organizations, prompting.', withGrant.length)
      const organizationChoices = [
        {value: 'none', name: 'None'},
        new prompt.Separator(),
        ...withGrant.map((organization) => ({
          value: organization.id,
          name: `${organization.name} [${organization.id}]`,
        })),
      ]

      const chosenOrg = await prompt.single({
        message: 'Select organization to attach project to',
        type: 'list',
        choices: organizationChoices,
      })

      if (chosenOrg && chosenOrg !== 'none') {
        organizationId = chosenOrg
      }
    } else if (organizationId) {
      debug(`User has defined organization flag explicitly (%s)`, organizationId)
    } else if (organizations.length === 0) {
      debug('User has no organizations, skipping selection prompt')
    }

    return organizationId || undefined
  }

  async function hasProjectAttachGrant(organizationId: string) {
    const requiredGrantGroup = 'sanity.organization.projects'
    const requiredGrant = 'attach'

    const client = apiClient({requireProject: false, requireUser: true})
      .clone()
      .config({apiVersion: 'v2021-06-07'})

    const grants = await client.request({uri: `organizations/${organizationId}/grants`})
    const group: {grants: {name: string}[]}[] = grants[requiredGrantGroup] || []
    return group.some(
      (resource) => resource.grants && resource.grants.some((grant) => grant.name === requiredGrant)
    )
  }

  function getOrganizationsWithAttachGrant(organizations: ProjectOrganization[]) {
    return pFilter(organizations, (org) => hasProjectAttachGrant(org.id), {concurrency: 3})
  }
}

async function doDatasetImport(options: {
  outputPath: string
  template: ProjectTemplate
  datasetName: string
  context: CliCommandContext
  coreCommands: CliCommandDefinition[]
}): Promise<unknown> {
  const {outputPath, coreCommands, template, datasetName, context} = options
  if (!template.datasetUrl) {
    return undefined
  }

  const manifestPath = path.join(outputPath, 'sanity.json')
  const baseManifest = await loadJson(manifestPath, undefined)
  const manifest = reduceConfig(baseManifest || {}, environment, {
    studioRootPath: outputPath,
  })

  if (!manifest.api) {
    throw new Error('No `api` section present in `sanity.json`')
  }

  if (!manifest.api.projectId || !manifest.api.dataset) {
    throw new Error('Missing `projectId` or `dataset` from `api` section of `sanity.json`')
  }

  const importCmd = coreCommands.find((cmd) => cmd.name === 'import' && cmd.group === 'dataset')
  if (!importCmd) {
    throw new Error('Failed to find `sanity dataset import` command')
  }

  const commandArgs: CliCommandArguments = {
    argv: [template.datasetUrl, datasetName],
    argsWithoutOptions: [template.datasetUrl, datasetName],
    extOptions: {},
    groupOrCommand: 'import',
    extraArguments: [],
  }

  const {projectId, dataset} = manifest.api
  const apiClient = getClientWrapper({projectId, dataset}, manifestPath)

  const commandContext: CliCommandContext & {fromInitCommand: boolean} = {
    ...context,
    apiClient,
    workDir: outputPath,
    fromInitCommand: true,
  }

  return importCmd.action(commandArgs, commandContext)
}

async function getPlanFromCoupon(apiClient: CliApiClient, couponCode: string): Promise<string> {
  const response = await apiClient({
    requireUser: false,
    requireProject: false,
  }).request({
    method: 'GET',
    uri: `plans/coupon/${couponCode}`,
  })

  try {
    const planId = response[0].id
    if (!planId) {
      throw new Error('Unable to find a plan from coupon code')
    }
    return planId
  } catch (err) {
    throw err
  }
}
