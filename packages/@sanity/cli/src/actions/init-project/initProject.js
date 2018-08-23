import os from 'os'
import path from 'path'
import fs from 'fs'
import fse from 'fs-extra'
import resolveFrom from 'resolve-from'
import deburr from 'lodash/deburr'
import noop from 'lodash/noop'
import {reduceConfig} from '@sanity/util'
import {loadJson} from '@sanity/util/lib/safeJson'
import debug from '../../debug'
import clientWrapper from '../../util/clientWrapper'
import getUserConfig from '../../util/getUserConfig'
import getProjectDefaults from '../../util/getProjectDefaults'
import createProject from '../project/createProject'
import login from '../login/login'
import dynamicRequire from '../../util/dynamicRequire'
import promptForDatasetName from './promptForDatasetName'
import bootstrapTemplate from './bootstrapTemplate'
import templates from './templates'

/* eslint-disable no-process-env */
const isCI = process.env.CI
const sanityEnv = process.env.SANITY_ENV
const environment = sanityEnv ? sanityEnv : process.env.NODE_ENV
/* eslint-enable no-process-env */

// eslint-disable-next-line max-statements
export default async function initSanity(args, context) {
  const {output, prompt, workDir, apiClient, yarn, chalk} = context
  const cliFlags = args.extOptions
  const unattended = cliFlags.y || cliFlags.yes
  const print = unattended ? noop : output.print

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

  const flags = await prepareFlags(cliFlags)

  // We're authenticated, now lets select or create a project
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
    dataset: flags.dataset,
    aclMode: flags.visibility
  })

  debug(`Dataset with name ${datasetName} selected`)

  // Gather project defaults based on environment
  const defaults = await getProjectDefaults(workDir, {isPlugin: false, context})

  // Prompt the user for required information
  const answers = await getProjectInfo()

  // Ensure we are using the output path provided by user
  const outputPath = answers.outputPath || workDir

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
    ...answers
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
  const coreCommands = dynamicRequire(resolveFrom.silent(outputPath, '@sanity/core')).commands
  const configCheckCmd = coreCommands.find(cmd => cmd.name === 'configcheck')
  await configCheckCmd.action(
    {extOptions: {quiet: true}},
    Object.assign({}, context, {
      workDir: outputPath
    })
  )

  // Prompt for dataset import (if a dataset is defined)
  if (shouldImport) {
    await doDatasetImport()
  }

  if (shouldImport) {
    print('')
    print(
      `If you want to delete the imported data, use ${chalk.cyan(
        `sanity dataset delete ${datasetName}`
      )}`
    )
  }

  print(`\n${chalk.green('Success!')} Now what?\n`)

  const isCurrentDir = outputPath === process.cwd()
  if (!isCurrentDir) {
    print(`▪ ${chalk.cyan(`cd ${outputPath}`)}, then:`)
  }

  print(`▪ ${chalk.cyan('sanity docs')} for documentation`)
  print(`▪ ${chalk.cyan('sanity manage')} to open the management tool`)
  print(`▪ ${chalk.green('sanity start')} to run your studio\n`)

  // See if the template has a success message handler and print it
  const successMessage = template.getSuccessMessage
    ? template.getSuccessMessage(initOptions, context)
    : ''

  if (successMessage) {
    print(`\n${successMessage}`)
  }

  async function getOrCreateUser() {
    print("We can't find any auth credentials in your Sanity config - looks like you")
    print("haven't used Sanity on this system before?\n")

    // Provide login options (`sanity login`)
    await login(args, context)

    print("Good stuff, you're now authenticated. You'll need a project to keep your")
    print('datasets and collaborators safe and snug.')
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

    if (flags.project) {
      const project = projects.find(proj => proj.id === flags.project)
      if (!project && !unattended) {
        throw new Error(
          `Given project ID (${flags.project}) not found, or you do not have access to it`
        )
      }

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
      choices: [
        {value: 'new', name: 'Create new project'},
        new prompt.Separator(),
        ...projectChoices
      ]
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
    if (opts.dataset && isCI) {
      return {datasetName: opts.dataset}
    }

    const client = apiClient({api: {projectId: opts.projectId}})
    const [datasets, projectFeatures] = await Promise.all([
      client.datasets.list(),
      client.request({uri: '/features'})
    ])

    const privateDatasetsAllowed = projectFeatures.includes('privateDataset')
    const allowedModes = privateDatasetsAllowed ? ['public', 'private'] : ['public']

    if (opts.aclMode && allowedModes.includes(opts.aclMode)) {
      throw new Error(`Visibility mode "${opts.aclMode}" not allowed`)
    }

    // Getter in order to present prompts in a more logical order
    const getAclMode = () => {
      if (opts.aclMode) {
        return opts.aclMode
      }

      if (unattended || !privateDatasetsAllowed) {
        return 'public'
      } else if (privateDatasetsAllowed) {
        return promptForAclMode(prompt, output)
      }

      return opts.aclMode
    }

    if (opts.dataset) {
      debug('User has specified dataset through a flag (%s)', opts.dataset)
      const existing = datasets.find(ds => ds.name === opts.dataset)

      if (!existing) {
        debug('Specified dataset not found, creating it')
        const aclMode = await getAclMode()
        await client.datasets.create(opts.dataset, {aclMode})
      }

      return {datasetName: opts.dataset}
    }

    if (datasets.length === 0) {
      debug('No datasets found for project, prompting for name')
      const name = await promptForDatasetName(prompt, {
        message: 'Name of your first dataset:',
        default: 'production'
      })

      const aclMode = await getAclMode()
      await client.datasets.create(name, {aclMode})
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
        message: 'Name your dataset:',
        default: 'production'
      })
      const aclMode = await getAclMode()
      await client.datasets.create(newDatasetName, {aclMode})
      return {datasetName: newDatasetName}
    }

    debug(`Returning selected dataset (${selected})`)
    return {datasetName: selected}
  }

  function promptForDatasetImport(message) {
    return prompt.single({
      type: 'confirm',
      message: message || 'This template includes a sample dataset, would you like to import it?',
      default: true
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
          name: 'Movie database (schema + sample data)'
        },
        {
          value: 'ecommerce',
          name: 'E-commerce (schema + sample data)'
        },
        {
          value: 'blog',
          name: 'Blog (schema)'
        },
        {
          value: 'clean',
          name: 'Clean project with no predefined schemas'
        }
      ]
    })
  }

  async function doDatasetImport() {
    const manifestPath = path.join(outputPath, 'sanity.json')
    const baseManifest = await loadJson(manifestPath)
    const manifest = reduceConfig(baseManifest || {}, environment)

    const importCmd = coreCommands.find(cmd => cmd.name === 'import' && cmd.group === 'dataset')
    return importCmd.action(
      {argsWithoutOptions: [template.datasetUrl, datasetName], extOptions: {}},
      Object.assign({}, context, {
        apiClient: clientWrapper(manifest, manifestPath),
        workDir: outputPath,
        fromInitCommand: true
      })
    )
  }

  async function getProjectInfo() {
    const specifiedPath = flags['output-path'] && path.resolve(flags['output-path'])

    if (unattended) {
      return Object.assign({license: 'UNLICENSED'}, defaults, {
        outputPath: specifiedPath
      })
    }

    const workDirIsEmpty = (await fse.readdir(workDir)).length === 0
    return {
      description: defaults.description,
      gitRemote: defaults.gitRemote,
      author: defaults.author,
      license: 'UNLICENSED',

      outputPath: specifiedPath || await prompt.single({
        type: 'input',
        message: 'Output path:',
        default: workDirIsEmpty ? workDir : path.join(workDir, sluggedName),
        validate: validateEmptyPath,
        filter: absolutify
      })
    }
  }

  async function prepareFlags() {
    const createProjectName = cliFlags['create-project']
    if (cliFlags.project && createProjectName) {
      throw new Error(
        'Both `--project` and `--create-project` specified, only a single is supported'
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
      const requiredForUnattended = ['dataset', 'output-path']
      requiredForUnattended.forEach(flag => {
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
        displayName: createProjectName.trim()
      })
      debug('Project with ID %s created', createdProject.projectId)

      if (cliFlags.dataset) {
        debug('--dataset specified, creating dataset (%s)', cliFlags.dataset)
        const client = apiClient({api: {projectId: createdProject.projectId}})
        await client.datasets.create(cliFlags.dataset)
      }

      const newFlags = Object.assign({}, cliFlags, {project: createdProject.projectId})
      delete newFlags['create-project']

      return newFlags
    }

    return cliFlags
  }
}

function validateEmptyPath(dir) {
  const checkPath = absolutify(dir)
  return pathIsEmpty(checkPath) ? true : 'Given path is not empty'
}

function pathIsEmpty(dir) {
  // We are using fs instead of fs-extra because it silently, weirdly, crashes on windows
  try {
    // eslint-disable-next-line no-sync
    const content = fs.readdirSync(dir)
    return content.length === 0
  } catch (err) {
    if (err.code === 'ENOENT') {
      return true
    }

    throw err
  }
}

function expandHome(filePath) {
  if (filePath.charCodeAt(0) === 126 /* ~ */) {
    if (filePath.charCodeAt(1) === 43 /* + */) {
      return path.join(process.cwd(), filePath.slice(2))
    }

    const home = os.homedir()
    return home ? path.join(home, filePath.slice(1)) : filePath
  }

  return filePath
}

function absolutify(dir) {
  const pathName = expandHome(dir)
  return path.isAbsolute(pathName) ? pathName : path.resolve(process.cwd(), pathName)
}

async function promptForAclMode(prompt, output) {
  const mode = await prompt.single({
    type: 'list',
    message: 'Dataset visibility',
    choices: [
      {
        value: 'public',
        name: 'Public (world readable)'
      },
      {
        value: 'private',
        name: 'Private (Authenticated user or token needed)'
      }
    ]
  })

  if (mode === 'private') {
    output.print(
      'Please note that while documents are private, assets (files and images) are still public\n'
    )
  }

  return mode
}
