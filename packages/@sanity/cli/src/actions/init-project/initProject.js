import fs from 'fs'
import os from 'os'
import path from 'path'
import fse from 'fs-extra'
import resolveFrom from 'resolve-from'
import deburr from 'lodash/deburr'
import noop from 'lodash/noop'
import {loadJson} from '@sanity/util/lib/safeJson'
import {reduceConfig} from '@sanity/util'
import debug from '../../debug'
import clientWrapper from '../../util/clientWrapper'
import getUserConfig from '../../util/getUserConfig'
import getProjectDefaults from '../../util/getProjectDefaults'
import login from '../login/login'
import dynamicRequire from '../../util/dynamicRequire'
import getOrCreateProject from './getOrCreateProject'
import getOrCreateDataset from './getOrCreateDataset'
import bootstrapTemplate from './bootstrapTemplate'
import templates from './templates'
import prepareFlags from './prepareFlags'

/* eslint-disable no-process-env */
const sanityEnv = process.env.SANITY_INTERNAL_ENV
const environment = sanityEnv ? sanityEnv : process.env.NODE_ENV
/* eslint-enable no-process-env */

// eslint-disable-next-line max-statements, complexity
export default async function initSanity(args, context) {
  const {output, prompt, workDir, apiClient, yarn, chalk} = context
  const cliFlags = args.extOptions
  const unattended = cliFlags.y || cliFlags.yes
  const print = unattended ? noop : output.print
  const specifiedOutputPath = cliFlags['output-path']
  const useDefaultDatasetConfig = cliFlags['dataset-default']
  let reconfigure = cliFlags.reconfigure

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
    print(`You're setting up a new project!`)
    print(`We'll make sure you have an account with Sanity.io. Then we'll`)
    print('install an open-source JS content editor that connects to')
    print('the real-time hosted API on Sanity.io. Hang on.\n')
    print('Press ctrl + C at any time to quit.\n')
    print('Prefer web interfaces to terminals?')
    print('You can also set up best practice Sanity projects with')
    print('your favorite frontends on https://sanity.io/create\n')
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

  const flags = await prepareFlags(cliFlags, {apiClient, output})

  // We're authenticated, now lets select or create a project
  debug('Prompting user to select or create a project')
  const {projectId, displayName, isFirstProject} = await getOrCreateProject({
    apiClient,
    unattended,
    flags,
    prompt
  })

  const sluggedName = deburr(displayName.toLowerCase())
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9]/g, '')

  debug(`Project with name ${displayName} selected`)

  // Now let's pick or create a dataset
  debug('Prompting user to select or create a dataset')
  const {datasetName} = await getOrCreateDataset({
    dataset: flags.dataset,
    useDefaultConfig: useDefaultDatasetConfig,
    aclMode: flags.visibility,
    client: apiClient({api: {projectId}}),
    unattended,
    prompt,
    output
  })

  debug(`Dataset with name ${datasetName} selected`)

  let outputPath = workDir
  let successMessage
  let defaults

  if (reconfigure) {
    // Rewrite project manifest (sanity.json)
    const projectInfo = projectManifest.project || {}
    const newProps = {
      root: true,
      api: {
        ...(projectManifest.api || {}),
        projectId,
        dataset: datasetName
      },
      project: {
        ...projectInfo,
        // Keep original name if present
        name: projectInfo.name || displayName
      }
    }

    // Ensure root, api and project keys are at top to follow sanity.json key order convention
    projectManifest = {
      ...newProps,
      ...projectManifest,
      ...newProps
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
    const corePath = resolveFrom.silent(outputPath, '@sanity/core')

    debug('@sanity/core path resolved to %s', corePath || 'null')
    debug('(from %s)', outputPath)
    const coreModule = dynamicRequire(corePath)
    const coreCommands = coreModule && coreModule.commands

    if (!Array.isArray(coreCommands)) {
      throw new Error('@sanity/core module failed to be resolved')
    }

    const configCheckCmd = coreCommands.find(cmd => cmd.name === 'configcheck')
    await configCheckCmd.action(
      {extOptions: {quiet: true}},
      Object.assign({}, context, {
        workDir: outputPath
      })
    )

    // Prompt for dataset import (if a dataset is defined)
    if (shouldImport) {
      await doDatasetImport({
        outputPath,
        coreCommands,
        template,
        datasetName,
        context
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

  print(`\n${chalk.green('Success!')} Now what?\n`)

  const isCurrentDir = outputPath === process.cwd()
  if (!isCurrentDir) {
    print(`▪ ${chalk.cyan(`cd ${outputPath}`)}, then:`)
  }

  print(`▪ ${chalk.cyan('sanity docs')} to open the documentation in a browser`)
  print(`▪ ${chalk.cyan('sanity manage')} to open the project settings in a browser`)
  print(`▪ ${chalk.cyan('sanity help')} to explore the CLI manual`)
  print(`▪ ${chalk.green('sanity start')} to run your studio\n`)

  if (successMessage) {
    print(`\n${successMessage}`)
  }

  const sendInvite =
    isFirstProject &&
    (await prompt.single({
      type: 'confirm',
      message:
        'We have an excellent developer community, would you like us to send you an invitation to join?',
      default: true
    }))

  if (sendInvite) {
    apiClient({requireProject: false})
      .request({
        uri: '/invitations/community',
        method: 'POST'
      })
      .catch(noop)
  }

  async function getOrCreateUser() {
    print(`We can't find any auth credentials in your Sanity config`)
    print('- log in or create a new account\n')

    // Provide login options (`sanity login`)
    await login(args, context)

    print("Good stuff, you're now authenticated. You'll need a project to keep your")
    print('datasets and collaborators safe and snug.')
  }

  function promptForDatasetImport(message) {
    return prompt.single({
      type: 'confirm',
      message: message || 'This template includes a sample dataset, would you like to use it?',
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
          name: 'Movie project (schema + sample data)'
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

      outputPath:
        specifiedPath ||
        (await prompt.single({
          type: 'input',
          message: 'Project output path:',
          default: workDirIsEmpty ? workDir : path.join(workDir, sluggedName),
          validate: validateEmptyPath,
          filter: absolutify
        }))
    }
  }
}

function promptImplicitReconfigure(prompt) {
  return prompt.single({
    type: 'confirm',
    message:
      'The current folder contains a configured Sanity studio. Would you like to reconfigure it?',
    default: true
  })
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

async function doDatasetImport(options) {
  const {outputPath, coreCommands, template, datasetName, context} = options
  const manifestPath = path.join(outputPath, 'sanity.json')
  const baseManifest = await loadJson(manifestPath)
  const manifest = reduceConfig(baseManifest || {}, environment, {
    studioRootPath: outputPath
  })

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
