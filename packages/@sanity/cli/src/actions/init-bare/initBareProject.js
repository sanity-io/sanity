import fs from 'fs'
import os from 'os'
import path from 'path'
import fse from 'fs-extra'
import deburr from 'lodash/deburr'
import noop from 'lodash/noop'
import debug from '../../debug'
import login from '../login/login'
import getUserConfig from '../../util/getUserConfig'
import resolveLatestVersions from '../../util/resolveLatestVersions'
import prepareFlags from '../init-project/prepareFlags'
import getOrCreateProject from '../init-project/getOrCreateProject'
import getOrCreateDataset from '../init-project/getOrCreateDataset'

// eslint-disable-next-line max-statements, complexity
export default async function initBare(args, context) {
  const {output, prompt, workDir, apiClient, chalk} = context
  const cliFlags = args.extOptions
  const unattended = cliFlags.y || cliFlags.yes
  const print = unattended ? noop : output.print
  const specifiedOutputPath = cliFlags['output-path']

  print(`You're setting up a new, bare project!`)
  print(`We'll make sure you have an account with Sanity.io. Then we'll`)
  print('install a few dependencies needed to use the CLI in a project')
  print('context to communicate with the real-time hosted API on Sanity.io.')
  print('Press ctrl + C at any time to quit.\n')
  print('Prefer web interfaces to terminals?')
  print('You can also set up best practice Sanity projects with')
  print('your favorite frontends on https://sanity.io/create\n')

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

  // Does the user want a dataset?
  let configureDataset = true
  if (!flags.dataset && !flags.visibility && !flags.datasetDefault) {
    configureDataset = await prompt.single({
      type: 'confirm',
      message: 'Do you want to select or create a dataset?',
      default: true
    })
  }

  // Now let's pick or create a dataset
  let datasetName
  if (configureDataset) {
    debug('Prompting user to select or create a dataset')
    datasetName = (
      await getOrCreateDataset({
        dataset: flags.dataset,
        useDefaultConfig: cliFlags['dataset-default'],
        aclMode: flags.visibility,
        client: apiClient({api: {projectId}}),
        unattended,
        prompt,
        output
      })
    ).datasetName

    debug(`Dataset with name ${datasetName} selected`)
  }

  // Does the user want a sanity.json/package.json?
  let outputPath
  const createFiles =
    specifiedOutputPath ||
    (await prompt.single({
      type: 'confirm',
      message:
        'Do you want to create a project folder with a sanity.json? This will allow you to run CLI commands interacting with your project.',
      default: true
    }))

  if (createFiles) {
    // Prompt the user for output path
    const specifiedPath = specifiedOutputPath && path.resolve(specifiedOutputPath)
    const workDirIsEmpty = (await fse.readdir(workDir)).length === 0
    outputPath = specifiedPath || workDir
    if (!unattended && (!workDirIsEmpty || !outputPath)) {
      outputPath = await prompt.single({
        type: 'input',
        message: 'Project output path:',
        default: workDirIsEmpty ? workDir : path.join(workDir, sluggedName),
        validate: validateEmptyPath,
        filter: absolutify
      })
    }

    // Ensure directory exists
    await fse.mkdirp(outputPath)

    // Write a sanity.json
    await fse.writeJson(
      path.join(outputPath, 'sanity.json'),
      {
        root: true,
        project: {name: displayName},
        api: {projectId, dataset: datasetName},
        plugins: [],
        parts: []
      },
      {spaces: 2}
    )

    // And a package.json, for `@sanity/core`
    await fse.writeJson(
      path.join(outputPath, 'package.json'),
      {
        name: sluggedName,
        version: '0.0.1',
        private: true,
        dependencies: await resolveLatestVersions(['@sanity/core'], {asRange: true})
      },
      {spaces: 2}
    )
  }

  print(`\n${chalk.green('Success!')}`)
  print(`Project ID: ${chalk.green(projectId)}`)

  if (datasetName) {
    print(`Dataset:    ${chalk.green(datasetName)}`)
  }

  if (createFiles) {
    print(`\nNow what?\n`)

    const isCurrentDir = outputPath === process.cwd()
    if (!isCurrentDir) {
      print(`▪ ${chalk.cyan(`cd ${outputPath}`)}, then:`)
    }

    print(`▪ ${chalk.cyan('npm i')} or ${chalk.cyan('yarn')} to install CLI dependencies`)
    print(`▪ ${chalk.cyan('sanity docs')} to open the documentation in a browser`)
    print(`▪ ${chalk.cyan('sanity manage')} to open the project settings in a browser`)
    print(`▪ ${chalk.cyan('sanity help')} to explore the CLI manual\n`)
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

    print("Good stuff, you're now authenticated.")
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
