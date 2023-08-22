import {existsSync, readFileSync} from 'fs'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'
import deburr from 'lodash/deburr'
import noop from 'lodash/noop'
import pFilter from 'p-filter'
import resolveFrom from 'resolve-from'
import which from 'which'

import type {DatasetAclMode} from '@sanity/client'
import {type Framework, frameworks} from '@vercel/frameworks'
import execa, {CommonOptions} from 'execa'
import {evaluate, patch} from 'golden-fleece'
import {LocalFileSystemDetector, detectFrameworkRecord} from '@vercel/fs-detectors'
import type {InitFlags} from '../../commands/init/initCommand'
import {debug} from '../../debug'
import {
  getPackageManagerChoice,
  installDeclaredPackages,
  installNewPackages,
} from '../../packageManager'
import {PackageManager, getPartialEnvWithNpmPath} from '../../packageManager/packageManagerChoice'
import {
  CliApiClient,
  CliCommandArguments,
  CliCommandContext,
  CliCommandDefinition,
  SanityCore,
  SanityModuleInternal,
} from '../../types'
import {getClientWrapper} from '../../util/clientWrapper'
import {dynamicRequire} from '../../util/dynamicRequire'
import {ProjectDefaults, getProjectDefaults} from '../../util/getProjectDefaults'
import {getUserConfig} from '../../util/getUserConfig'
import {isCommandGroup} from '../../util/isCommandGroup'
import {isInteractive} from '../../util/isInteractive'
import {LoginFlags, login} from '../login/login'
import {createProject} from '../project/createProject'
import {BootstrapOptions, bootstrapTemplate} from './bootstrapTemplate'
import {GenerateConfigOptions} from './createStudioConfig'
import {absolutify, validateEmptyPath} from './fsUtils'
import {tryGitInit} from './git'
import {promptForDatasetName} from './promptForDatasetName'
import {promptForAclMode, promptForDefaultConfig, promptForTypeScript} from './prompts'
import {reconfigureV2Project} from './reconfigureV2Project'
import templates from './templates'
import {
  sanityCliTemplate,
  sanityConfigTemplate,
  sanityFolder,
  sanityStudioAppTemplate,
  sanityStudioPagesTemplate,
} from './templates/nextjs'
import {
  promptForAppDir,
  promptForAppendEnv,
  promptForEmbeddedStudio,
  promptForNextTemplate,
  promptForStudioPath,
} from './prompts/nextjs'

// eslint-disable-next-line no-process-env
const isCI = process.env.CI

export interface InitOptions {
  template: string
  outputDir: string
  name: string
  displayName: string
  dataset: string
  projectId: string
  author: string | undefined
  description: string | undefined
  gitRemote: string | undefined
  license: string | undefined
  outputPath: string | undefined
  projectName: string
  useTypeScript: boolean
}

export interface ProjectTemplate {
  datasetUrl?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  importPrompt?: string
  configTemplate?: string | ((variables: GenerateConfigOptions['variables']) => string)
  typescriptOnly?: boolean
}

export interface ProjectOrganization {
  id: string
  name: string
  slug: string
}

// eslint-disable-next-line max-statements, complexity
export default async function initSanity(
  args: CliCommandArguments<InitFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {output, prompt, workDir, apiClient, chalk, sanityMajorVersion} = context
  const cliFlags = args.extOptions
  const unattended = cliFlags.y || cliFlags.yes
  const print = unattended ? noop : output.print
  const intendedPlan = cliFlags['project-plan']
  const intendedCoupon = cliFlags.coupon
  const reconfigure = cliFlags.reconfigure
  const commitMessage = cliFlags.git
  const useGit = typeof commitMessage === 'undefined' ? true : Boolean(commitMessage)
  const bareOutput = cliFlags.bare
  const env = cliFlags.env

  let defaultConfig = cliFlags['dataset-default']
  let showDefaultConfigPrompt = !defaultConfig

  if (sanityMajorVersion === 2) {
    await reconfigureV2Project(args, context)
    return
  }

  // Only allow either --project-plan or --coupon
  if (intendedCoupon && intendedPlan) {
    throw new Error(
      'Error! --project-plan and --coupon cannot be used together; please select only one flag',
    )
  }

  // Don't allow --coupon and --project
  if (intendedCoupon && cliFlags.project) {
    throw new Error(
      'Error! --project and --coupon cannot be used together; coupons can only be applied to new projects',
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

  if (reconfigure) {
    throw new Error('`--reconfigure` is deprecated - manual configuration is now required')
  }

  // use vercel's framework detector
  const detectedFramework: Framework | null = await detectFrameworkRecord({
    fs: new LocalFileSystemDetector(workDir),
    frameworkList: frameworks as readonly Framework[],
  })

  const envFilename = typeof env === 'string' ? env : '.env'
  if (!envFilename.startsWith('.env')) {
    throw new Error(`Env filename must start with .env`)
  }

  const usingBareOrEnv = cliFlags.bare || cliFlags.env
  print(`You're setting up a new project!`)
  print(`We'll make sure you have an account with Sanity.io. ${usingBareOrEnv ? '' : `Then we'll`}`)
  if (!usingBareOrEnv) {
    print('install an open-source JS content editor that connects to')
    print('the real-time hosted API on Sanity.io. Hang on.\n')
  }
  print('Press ctrl + C at any time to quit.\n')
  print('Prefer web interfaces to terminals?')
  print('You can also set up best practice Sanity projects with')
  print('your favorite frontends on https://www.sanity.io/templates\n')

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

  // If user doesn't want to output any template code
  if (bareOutput) {
    print(`\n${chalk.green('Success!')} Below are your project details:\n`)
    print(`Project ID: ${chalk.cyan(projectId)}`)
    print(`Dataset: ${chalk.cyan(datasetName)}`)
    print(
      `\nYou can find your project on Sanity Manage — https://www.sanity.io/manage/project/${projectId}\n`,
    )
    return
  }

  const initNext =
    detectedFramework &&
    detectedFramework.slug === 'nextjs' &&
    (await prompt.single({
      type: 'confirm',
      message:
        'Would you like to add configuration files for a Sanity project in this Next.js folder?',
      default: true,
    }))

  // add more frameworks to this as we add support for them
  // this is used to skip the getProjectInfo prompt
  const initFramework = initNext

  let outputPath = workDir

  // Gather project defaults based on environment
  const defaults = await getProjectDefaults(workDir, {isPlugin: false, context})

  // Prompt the user for required information
  const answers = await getProjectInfo()

  // Ensure we are using the output path provided by user
  outputPath = answers.outputPath

  if (initNext) {
    const useTypeScript = unattended ? true : await promptForTypeScript(prompt)

    const fileExtension = useTypeScript ? 'ts' : 'js'

    const embeddedStudio = unattended ? true : await promptForEmbeddedStudio(prompt)

    if (embeddedStudio) {
      // this one is trickier on unattended, as we should probably scan for which one
      // they're using, but they can also use both
      const useAppDir = unattended ? false : await promptForAppDir(prompt)

      // find source path (app or pages dir)
      const srcDir = useAppDir ? 'app' : 'pages'
      let srcPath = path.join(workDir, srcDir)

      if (!existsSync(srcPath)) {
        srcPath = path.join(workDir, 'src', srcDir)
        if (!existsSync(srcPath)) {
          await fs
            .mkdir(srcPath, {recursive: true})
            .catch(() => debug('Error creating folder %s', srcPath))
        }
      }

      const studioPath = unattended ? '/studio' : await promptForStudioPath(prompt)

      const embeddedStudioRouteFilePath = path.join(
        srcPath,
        `${studioPath}/`,
        useAppDir ? `[[...index]]/page.${fileExtension}x` : `[[...index]].${fileExtension}x`,
      )

      // this selects the correct template string based on whether the user is using the app or pages directory and
      // replaces the ":configPath:" placeholder in the template with the correct path to the sanity.config.ts file.
      // we account for the user-defined embeddedStudioPath (default /studio) is accounted for by creating enough "../"
      // relative paths to reach the root level of the project
      await writeOrOverwrite(
        embeddedStudioRouteFilePath,
        (useAppDir ? sanityStudioAppTemplate : sanityStudioPagesTemplate).replace(
          ':configPath:',
          new Array(countNestedFolders(embeddedStudioRouteFilePath.slice(workDir.length)))
            .join('../')
            .concat('sanity.config'),
        ),
      )

      const sanityConfigPath = path.join(workDir, `sanity.config.${fileExtension}`)
      await writeOrOverwrite(
        sanityConfigPath,
        sanityConfigTemplate
          .replace(':route:', embeddedStudioRouteFilePath.slice(workDir.length).replace('src/', ''))
          .replace(':basePath:', studioPath),
      )
    }

    const sanityCliPath = path.join(workDir, `sanity.cli.${fileExtension}`)
    await writeOrOverwrite(sanityCliPath, sanityCliTemplate)

    // write sanity folder files
    const writeSourceFiles = async (
      files: Record<string, string | Record<string, string>>,
      folderPath?: string,
    ) => {
      for (const [filePath, content] of Object.entries(files)) {
        // check if file ends with full stop to indicate it's file and not directory (this only works with our template tree structure)
        if (filePath.includes('.') && typeof content === 'string') {
          await writeOrOverwrite(
            path.join(workDir, 'sanity', folderPath || '', `${filePath}${fileExtension}`),
            content,
          )
        } else {
          await fs.mkdir(path.join(workDir, 'sanity', filePath), {recursive: true})
          if (typeof content === 'object') {
            await writeSourceFiles(content, filePath)
          }
        }
      }
    }

    // ask what kind of schema setup the user wants
    const templateToUse = unattended ? 'clean' : await promptForNextTemplate(prompt)

    await writeSourceFiles(sanityFolder(useTypeScript, templateToUse))

    // set tsconfig.json target to ES2017
    const tsConfigPath = path.join(workDir, 'tsconfig.json')

    if (useTypeScript && existsSync(tsConfigPath)) {
      const tsConfigFile = readFileSync(tsConfigPath, 'utf8')
      const config = evaluate(tsConfigFile)

      if (config.compilerOptions.target?.toLowerCase() !== 'es2017') {
        config.compilerOptions.target = 'ES2017'

        const newConfig = patch(tsConfigFile, config)
        await fs.writeFile(tsConfigPath, Buffer.from(newConfig))
      }
    }

    const appendEnv = unattended ? true : await promptForAppendEnv(prompt, envFilename)

    if (appendEnv) {
      await createOrAppendEnvVars(envFilename, detectedFramework, {
        log: true,
      })
    }

    const {chosen} = await getPackageManagerChoice(workDir, {interactive: false})

    await installNewPackages(
      {
        packageManager: chosen,
        packages: ['@sanity/vision@3', 'sanity@3', '@sanity/image-url@1', 'styled-components@6'],
      },
      {
        output: context.output,
        workDir,
      },
    )

    // will refactor this later
    const execOptions: CommonOptions<'utf8'> = {
      encoding: 'utf8',
      env: getPartialEnvWithNpmPath(workDir),
      cwd: workDir,
      stdio: 'inherit',
    }

    if (chosen === 'npm') {
      await execa('npm', ['install', 'next-sanity@5'], execOptions)
    } else if (chosen === 'yarn') {
      await execa('npx', ['install-peerdeps', '--yarn', 'next-sanity@5'], execOptions)
    } else if (chosen === 'pnpm') {
      await execa('pnpm', ['install', 'next-sanity@5'], execOptions)
    }

    print(
      `\n${chalk.green('Success!')} Your Sanity configuration files has been added to this project`,
    )

    // eslint-disable-next-line no-process-exit
    process.exit(0)

    return
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function countNestedFolders(path: string): number {
    const separator = path.includes('\\') ? '\\' : '/'
    return path.split(separator).filter(Boolean).length
  }

  async function writeOrOverwrite(filePath: string, content: string) {
    if (existsSync(filePath)) {
      const overwrite = await prompt.single({
        type: 'confirm',
        message: `File ${chalk.yellow(
          filePath.replace(workDir, ''),
        )} already exists. Do you want to overwrite it?`,
        default: false,
      })

      if (!overwrite) {
        return
      }
    }

    // make folder if not exists
    const folderPath = path.dirname(filePath)

    await fs
      .mkdir(folderPath, {recursive: true})
      .catch(() => debug('Error creating folder %s', folderPath))

    await fs.writeFile(filePath, content, {
      encoding: 'utf8',
    })
  }

  // user wants to write environment variables to file
  if (env) {
    await createOrAppendEnvVars(envFilename, detectedFramework)
    return
  }

  // Prompt for template to use
  const templateName = await selectProjectTemplate()

  const template = templates[templateName]
  if (!template) {
    throw new Error(`Template "${templateName}" not found`)
  }

  // Use typescript?
  const typescriptOnly = template.typescriptOnly === true
  let useTypeScript = true
  if (!typescriptOnly && typeof cliFlags.typescript === 'boolean') {
    useTypeScript = cliFlags.typescript
  } else if (!typescriptOnly && !unattended) {
    useTypeScript = await promptForTypeScript(prompt)
  }

  // Build a full set of resolved options
  const templateOptions: BootstrapOptions = {
    outputPath,
    packageName: sluggedName,
    templateName,
    useTypeScript,
    variables: {
      dataset: datasetName,
      projectId,
      projectName: displayName || answers.projectName,
    },
  }

  // If the template has a sample dataset, prompt the user whether or not we should import it
  const shouldImport =
    !unattended && template.datasetUrl && (await promptForDatasetImport(template.importPrompt))

  // Bootstrap Sanity, creating required project files, manifests etc
  await bootstrapTemplate(templateOptions, context)

  // Now for the slow part... installing dependencies
  const pkgManager = await getPackageManagerChoice(outputPath, {
    prompt,
    interactive: unattended ? false : isInteractive,
  })
  await installDeclaredPackages(outputPath, pkgManager.chosen, context)

  // Try initializing a git repository
  if (useGit) {
    tryGitInit(outputPath, typeof commitMessage === 'string' ? commitMessage : undefined)
  }

  // Prompt for dataset import (if a dataset is defined)
  if (shouldImport) {
    const importCommand = getImportCommand(outputPath, 3)
    await doDatasetImport({
      projectId,
      outputPath,
      importCommand,
      template,
      datasetName,
      context,
    })

    if (await hasGlobalCli()) {
      print('')
      print('If you want to delete the imported data, use')
      print(`  ${chalk.cyan(`sanity dataset delete ${datasetName}`)}`)
      print('and create a new clean dataset with')
      print(`  ${chalk.cyan(`sanity dataset create <name>`)}\n`)
    }
  }

  const devCommandMap: Record<PackageManager, string> = {
    yarn: 'yarn dev',
    npm: 'npm run dev',
    pnpm: 'pnpm dev',
    manual: 'npm run dev',
  }
  const devCommand = devCommandMap[pkgManager.chosen]

  const isCurrentDir = outputPath === process.cwd()
  if (isCurrentDir) {
    print(`\n${chalk.green('Success!')} Now, use this command to continue:\n`)
    print(`${chalk.cyan(devCommand)} - to run Sanity Studio\n`)
  } else {
    print(`\n${chalk.green('Success!')} Now, use these commands to continue:\n`)
    print(`First: ${chalk.cyan(`cd ${outputPath}`)} - to enter project’s directory`)
    print(`Then: ${chalk.cyan(devCommand)} - to run Sanity Studio\n`)
  }

  if (await hasGlobalCli()) {
    print(`Other helpful commands`)
    print(`sanity docs - to open the documentation in a browser`)
    print(`sanity manage - to open the project settings in a browser`)
    print(`sanity help - to explore the CLI manual`)
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

  // eslint-disable-next-line complexity
  async function getOrCreateProject(): Promise<{
    projectId: string
    displayName: string
    isFirstProject: boolean
  }> {
    const spinner = context.output.spinner('Fetching existing projects').start()
    let projects
    let organizations: ProjectOrganization[]
    try {
      const client = apiClient({requireUser: true, requireProject: false})
      const [allProjects, allOrgs] = await Promise.all([
        client.projects.list({includeMembers: false}),
        client.request({uri: '/organizations'}),
      ])
      projects = allProjects.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      organizations = allOrgs
      spinner.succeed()
    } catch (err) {
      if (unattended && flags.project) {
        spinner.succeed()
        return {projectId: flags.project, displayName: 'Unknown project', isFirstProject: false}
      }

      spinner.fail()
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

    if (flags.organization) {
      const organization =
        organizations.find((org) => org.id === flags.organization) ||
        organizations.find((org) => org.slug === flags.organization)

      if (!organization) {
        throw new Error(
          `Given organization ID (${flags.organization}) not found, or you do not have access to it`,
        )
      }

      if (!(await hasProjectAttachGrant(flags.organization))) {
        throw new Error(
          'You lack the necessary permissions to attach a project to this organization',
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
          : 'Using a coupon - skipping project selection',
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
    if (opts.dataset && (isCI || unattended)) {
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
          value: 'shopify',
          name: 'E-commerce (Shopify)',
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

  async function getProjectInfo(): Promise<ProjectDefaults & {outputPath: string}> {
    const specifiedPath = flags['output-path'] && path.resolve(flags['output-path'])

    if (unattended || specifiedPath || env || initFramework) {
      return {
        ...defaults,
        outputPath: specifiedPath || workDir,
      }
    }

    const workDirIsEmpty = (await fs.readdir(workDir)).length === 0
    const projectOutputPath = await prompt.single({
      type: 'input',
      message: 'Project output path:',
      default: workDirIsEmpty ? workDir : path.join(workDir, sluggedName),
      validate: validateEmptyPath,
      filter: absolutify,
    })

    return {
      ...defaults,
      outputPath: projectOutputPath,
    }
  }

  // eslint-disable-next-line complexity
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

    if (cliFlags.project && cliFlags.organization) {
      throw new Error(
        'You have specified both a project and an organization. To move a project to an organization please visit https://www.sanity.io/manage',
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

      const newFlags = {...cliFlags, project: createdProject.projectId}
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
      (resource) =>
        resource.grants && resource.grants.some((grant) => grant.name === requiredGrant),
    )
  }

  function getOrganizationsWithAttachGrant(organizations: ProjectOrganization[]) {
    return pFilter(organizations, (org) => hasProjectAttachGrant(org.id), {concurrency: 3})
  }

  async function createOrAppendEnvVars(
    filename: string,
    framework: Framework | null,
    options?: {log?: boolean},
  ) {
    // we will prepend SANITY_ to these variables later, together with the prefix
    const envVars = {
      PROJECT_ID: projectId,
      DATASET: datasetName,
    }

    try {
      if (framework && framework.envPrefix && !options?.log) {
        print(
          `\nDetected framework ${chalk.blue(framework?.name)}, using prefix '${
            framework.envPrefix
          }'`,
        )
      }

      await writeEnvVarsToFile(filename, envVars, {
        framework,
        outputPath,
        log: options?.log,
      })
    } catch (err) {
      print(err)
      throw new Error('An error occurred while creating .env', {cause: err})
    }
  }

  async function writeEnvVarsToFile(
    filename: string,
    envVars: Record<string, string>,
    options: {framework: Framework | null; outputPath: string; log?: boolean},
  ) {
    const envPrefix = options.framework?.envPrefix || ''
    const keyPrefix = envPrefix.includes('SANITY') ? envPrefix : `${envPrefix}SANITY_`
    const fileOutputPath = path.join(options.outputPath, filename)

    // prepend framework and sanity prefix to envVars
    for (const key of Object.keys(envVars)) {
      envVars[`${keyPrefix}${key}`] = envVars[key]
      delete envVars[key]
    }

    // make folder if not exists (if output path is specified)
    await fs
      .mkdir(options.outputPath, {recursive: true})
      .catch(() => debug('Error creating folder %s', options.outputPath))

    // time to update or create the file
    const existingEnv = await fs
      .readFile(fileOutputPath, {encoding: 'utf8'})
      .catch((err) => (err.code === 'ENOENT' ? '' : Promise.reject(err)))

    const updatedEnv = parseAndUpdateEnvVars(existingEnv, envVars, {
      log: options.log,
    })

    const warningComment = [
      '# Warning: Do not add secrets (API keys and similar) to this file, as it source controlled!',
      '# Use `.env.local` for any secrets, and ensure it is not added to source control',
    ].join('\n')
    const shouldPrependWarning = !existingEnv.includes(warningComment)
    // prepend warning comment to the env vars if one does not exist
    if (shouldPrependWarning) {
      await fs.writeFile(fileOutputPath, `${warningComment}\n\n${updatedEnv}`, {
        encoding: 'utf8',
      })
      return
    }

    await fs.writeFile(fileOutputPath, updatedEnv, {
      encoding: 'utf8',
    })

    if (!options.log) {
      print(`\n${chalk.green('Success!')} Environment variables written to ${fileOutputPath}`)
    }
  }

  function parseAndUpdateEnvVars(
    fileContents: string,
    envVars: Record<string, string>,
    options?: {
      log?: boolean
    },
  ): string {
    const existingKeys = dotenv.parse(fileContents) // this will contain all vars
    const updatedKeys: Record<string, string> = {} // this will only contain our vars

    // find and update keys
    for (const [key, value] of Object.entries(envVars)) {
      if (!existingKeys[key]) {
        updatedKeys[key] = value
        if (!options?.log) {
          print(`Appended ${key}="${envVars[key]}"`)
        }
        continue
      }

      if (!options?.log) {
        print(`Found existing ${key}, replacing value.`)
      }
      updatedKeys[key] = value
    }

    // clone fileContents and replace existing keys by string matching
    let updatedEnv = fileContents
    for (const [key, value] of Object.entries(updatedKeys)) {
      if (existingKeys[key]) {
        const existingValue = existingKeys[key]

        updatedEnv = updatedEnv
          .split('\n')
          .map((line) => {
            if (
              !line.trim().startsWith('#') && // ignore comments
              new RegExp(`(^\\s*${key})((: )|( *=))`).test(line) // match key
            ) {
              return line.replace(existingValue, value)
            }
            return line
          })
          .join('\n')
      } else {
        updatedEnv = updatedEnv.trim().concat(`\n${key}="${value}"`)
      }
    }

    // if file is empty, add a newline
    return updatedEnv.concat(fileContents === '' ? '\n' : '')
  }
}

function doDatasetImport(options: {
  projectId: string
  outputPath: string
  template: ProjectTemplate
  datasetName: string
  context: CliCommandContext
  importCommand: CliCommandDefinition | undefined
}): Promise<unknown> {
  const {outputPath, importCommand, template, datasetName, projectId, context} = options
  if (!template.datasetUrl) {
    return Promise.resolve(undefined)
  }

  if (!importCommand) {
    throw new Error('Failed to find `sanity dataset import` command')
  }

  const commandArgs: CliCommandArguments = {
    argv: [template.datasetUrl, datasetName],
    argsWithoutOptions: [template.datasetUrl, datasetName],
    extOptions: {},
    groupOrCommand: 'import',
    extraArguments: [],
  }

  const configPath = context.cliConfigPath || path.join(outputPath, 'sanity.cli.js')
  const apiClient = getClientWrapper({projectId, dataset: datasetName}, configPath)

  const commandContext: CliCommandContext & {fromInitCommand: boolean} = {
    ...context,
    apiClient,
    workDir: outputPath,
    fromInitCommand: true,
  }

  return importCommand.action(commandArgs, commandContext)
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

function getImportCommand(
  outputPath: string,
  studioVersion: 2 | 3,
): CliCommandDefinition | undefined {
  if (studioVersion === 3) {
    const pkgPath = resolveFrom.silent(outputPath, 'sanity/_internal')
    if (!pkgPath) {
      throw new Error('Failed to resolve `sanity` module - problem with dependency installation?')
    }

    debug('`sanity` module path resolved to %s (from %s)', pkgPath, outputPath)
    const cliInternals = dynamicRequire<SanityModuleInternal>(pkgPath)
    if (!('cliProjectCommands' in cliInternals)) {
      throw new Error('Incorrect version of the `sanity` module installed')
    }

    return cliInternals.cliProjectCommands.commands.find(
      (cmd): cmd is CliCommandDefinition =>
        !isCommandGroup(cmd) && cmd.name === 'import' && cmd.group === 'dataset',
    )
  }

  const pkgPath = resolveFrom.silent(outputPath, '@sanity/core')
  if (!pkgPath) {
    throw new Error(
      'Failed to resolve `@sanity/core` module - problem with dependency installation?',
    )
  }

  debug('`@sanity/core` module path resolved to %s (from %s)', pkgPath, outputPath)
  const coreModule = dynamicRequire<SanityCore>(pkgPath)
  const coreCommands = coreModule && coreModule.commands

  if (!coreCommands || !Array.isArray(coreCommands)) {
    throw new Error('Incorrect version of the `@sanity/core` module installed')
  }

  return coreCommands.find(
    (cmd): cmd is CliCommandDefinition =>
      !isCommandGroup(cmd) && cmd.name === 'import' && cmd.group === 'dataset',
  )
}

async function hasGlobalCli(): Promise<boolean> {
  try {
    const globalCliPath = await which('sanity')
    return Boolean(globalCliPath)
  } catch (err) {
    return false
  }
}
