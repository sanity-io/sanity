import path from 'path'
import chalk from 'chalk'
import fse from 'fs-extra'
import {get, isPlainObject} from 'lodash'
import {promisify} from 'es6-promisify'
import {getDevServer} from '@sanity/server'
import getConfig from '@sanity/util/lib/getConfig'
import chooseDatasetPrompt from '../dataset/chooseDatasetPrompt'
import {tryInitializePluginConfigs} from '../../actions/config/reinitializePluginConfigs'
import checkStudioDependencyVersions from '../../util/checkStudioDependencyVersions'
import debug from '../../debug'
import {formatMessage, isLikelyASyntaxError} from './formatMessage'

export default async (args, context) => {
  const flags = args.extOptions
  const {output, workDir} = context

  await ensureProjectConfig(context)

  const sanityConfig = getConfig(workDir)
  const config = sanityConfig.get('server')
  const {port, hostname} = config
  const httpHost = flags.host === 'all' ? '0.0.0.0' : flags.host || hostname
  const httpPort = flags.port || port

  const serverOptions = {
    staticPath: resolveStaticPath(workDir, config),
    basePath: workDir,
    httpHost,
    httpPort,
    context,
    project: sanityConfig.get('project'),
  }

  checkStudioDependencyVersions(workDir)

  let compileSpinner
  const configSpinner = output.spinner('Checking configuration files...')
  await tryInitializePluginConfigs({workDir, output, env: 'development'})
  configSpinner.succeed()

  const server = getDevServer(serverOptions)
  const compiler = server.locals.compiler

  // "invalid" doesn't mean the bundle is invalid, but that it is *invalidated*,
  // in other words, it's recompiling
  compiler.plugin('invalid', () => {
    output.clear()
    resetSpinner()
  })

  // Start the server and try to create more user-friendly errors if we encounter issues
  try {
    await promisify(server.listen.bind(server))(httpPort, httpHost)
  } catch (err) {
    gracefulDeath(httpHost, config, err)
  }

  // Hold off on showing the spinner until compilation has started
  compiler.plugin('compile', () => resetSpinner())

  // "done" event fires when Webpack has finished recompiling the bundle.
  // Whether or not you have warnings or errors, you will get this event.

  compiler.plugin('done', (stats) => {
    if (compileSpinner) {
      compileSpinner.succeed()
    }

    const hasErrors = stats.hasErrors()
    const hasWarnings = stats.hasWarnings()

    if (!hasErrors && !hasWarnings) {
      output.print(
        chalk.green(`Content Studio successfully compiled! Go to http://${httpHost}:${httpPort}`) // eslint-disable-line max-len
      )
      return
    }

    const {errors, warnings} = stats.toJson({}, true)

    if (hasErrors) {
      printErrors(output, errors)
      return // If errors exist, ignore warnings.
    }

    if (hasWarnings) {
      printWarnings(output, warnings)
    }

    output.print(chalk.green(`Content Studio listening on http://${httpHost}:${httpPort}`))
  })

  function resetSpinner() {
    if (compileSpinner) {
      compileSpinner.stop()
    }

    compileSpinner = output.spinner('Compiling...').start()
  }
}

async function ensureProjectConfig(context) {
  const {workDir, output} = context
  const manifestPath = path.join(workDir, 'sanity.json')
  const projectManifest = await fse.readJson(manifestPath)
  const apiConfig = projectManifest.api || {}
  if (!isPlainObject(apiConfig)) {
    throw new Error('Invalid `api` property in `sanity.json` - should be an object')
  }

  // The API client wrapper extracts information from environment variables,
  // which means it could potentially hold any missing project ID / dataset
  let {projectId, dataset} = context.apiClient({requireProject: false, requireUser: false}).config()

  // The client wrapper returns `_dummy_` in the case where no dataset is configured,
  // to be able to do non-dataset requests without having the client complain.
  // We obviously don't want to use this as an actual value
  dataset = dataset === '_dummy_' ? undefined : dataset

  // Let the user know why these values are being used
  if (projectId && projectId !== apiConfig.projectId) {
    output.print(`Using project ID from environment config (${projectId})`)
  }

  if (dataset && dataset !== apiConfig.dataset) {
    output.print(`Using dataset from environment config (${dataset})`)
  }

  // If we're still missing information, prompt the user to provide them
  const configMissing = !projectId || !dataset
  if (!configMissing) {
    return
  }

  output.print('Project configuration required before starting studio')
  output.print('')

  let displayName = get(projectManifest, 'project.displayName')

  if (!projectId) {
    const selected = await getOrCreateProject(context)
    projectId = selected.projectId
    displayName = selected.displayName
  }

  if (!dataset) {
    const client = context
      .apiClient({requireUser: true, requireProject: false})
      .config({projectId, useProjectHostname: true})

    const apiClient = () => client
    const projectContext = {...context, apiClient}
    dataset = await chooseDatasetPrompt(projectContext, {allowCreation: true})
  }

  // Rewrite project manifest (sanity.json)
  const projectInfo = projectManifest.project || {}
  const newProps = {
    root: true,
    api: {
      ...apiConfig,
      projectId,
      dataset,
    },
    project: {
      ...projectInfo,
      // Keep original name if present
      name: projectInfo.name || displayName,
    },
  }

  await fse.outputJSON(
    manifestPath,
    {
      // We're listing `newProps` twice to ensure root, api and project keys
      // are at top to follow sanity.json key order convention
      ...newProps,
      ...projectManifest,
      ...newProps,
    },
    {spaces: 2}
  )

  output.print(`Project ID + dataset written to "${manifestPath}"`)
}

function resolveStaticPath(rootDir, config) {
  const {staticPath} = config
  return path.isAbsolute(staticPath) ? staticPath : path.resolve(path.join(rootDir, staticPath))
}

function gracefulDeath(httpHost, config, err) {
  if (err.code === 'EADDRINUSE') {
    throw new Error('Port number is already in use, configure `server.port` in `sanity.json`')
  }

  if (err.code === 'EACCES') {
    const help =
      config.port < 1024
        ? 'port numbers below 1024 requires root privileges'
        : `do you have access to listen to the given host (${httpHost})?`

    throw new Error(
      `The Content Studio server does not have access to listen to given port - ${help}`
    ) // eslint-disable-line max-len
  }

  throw err
}

function printErrors(output, errors) {
  output.print(chalk.red('Failed to compile.'))
  output.print('')

  const formattedErrors = (errors.some(isLikelyASyntaxError)
    ? errors.filter(isLikelyASyntaxError)
    : errors
  ).map((message) => `Error in ${formatMessage(message)}`)

  formattedErrors.forEach((message) => {
    output.print(message)
    output.print('')
  })
}

function printWarnings(output, warnings) {
  output.print(chalk.yellow('Compiled with warnings.'))
  output.print()

  warnings
    .map((message) => `Warning in ${formatMessage(message)}`)
    .forEach((message) => {
      output.print(message)
      output.print()
    })
}

async function getOrCreateProject(context) {
  const {prompt, apiClient} = context

  let projects
  try {
    projects = await apiClient({requireProject: false}).projects.list()
  } catch (err) {
    throw new Error(`Failed to communicate with the Sanity API:\n${err.message}`)
  }

  if (projects.length === 0) {
    debug('No projects found for user, prompting for name')
    const projectName = await prompt.single({message: 'Project name'})
    return createProject(apiClient, {displayName: projectName})
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
        message: 'Informal name for your project',
      }),
    })
  }

  debug(`Returning selected project (${selected})`)
  return {
    projectId: selected,
    displayName: projects.find((proj) => proj.id === selected).displayName,
  }
}

function createProject(apiClient, options) {
  return apiClient({
    requireUser: true,
    requireProject: false,
  })
    .request({
      method: 'POST',
      uri: '/projects',
      body: options,
    })
    .then((response) => ({
      projectId: response.projectId || response.id,
      displayName: options.displayName || '',
    }))
}
