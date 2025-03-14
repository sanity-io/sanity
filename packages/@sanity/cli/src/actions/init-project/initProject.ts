import {existsSync} from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import {type DatasetAclMode, type SanityProject} from '@sanity/client'
import {type Framework} from '@vercel/frameworks'
import {type detectFrameworkRecord} from '@vercel/fs-detectors'
import dotenv from 'dotenv'
import execa, {type CommonOptions} from 'execa'
import {deburr, noop} from 'lodash'
import pMap from 'p-map'
import resolveFrom from 'resolve-from'
import semver from 'semver'

import {CLIInitStepCompleted} from '../../__telemetry__/init.telemetry'
import {type InitFlags} from '../../commands/init/initCommand'
import {debug} from '../../debug'
import {
  getPackageManagerChoice,
  installDeclaredPackages,
  installNewPackages,
} from '../../packageManager'
import {
  ALLOWED_PACKAGE_MANAGERS,
  allowedPackageManagersString,
  getPartialEnvWithNpmPath,
  type PackageManager,
} from '../../packageManager/packageManagerChoice'
import {
  type CliApiClient,
  type CliCommandArguments,
  type CliCommandContext,
  type CliCommandDefinition,
  type SanityCore,
  type SanityModuleInternal,
  type SanityUser,
} from '../../types'
import {getClientWrapper} from '../../util/clientWrapper'
import {dynamicRequire} from '../../util/dynamicRequire'
import {getProjectDefaults, type ProjectDefaults} from '../../util/getProjectDefaults'
import {getProviderName} from '../../util/getProviderName'
import {getUserConfig} from '../../util/getUserConfig'
import {isCommandGroup} from '../../util/isCommandGroup'
import {isInteractive} from '../../util/isInteractive'
import {fetchJourneyConfig} from '../../util/journeyConfig'
import {checkIsRemoteTemplate, getGitHubRepoInfo, type RepoInfo} from '../../util/remoteTemplate'
import {login, type LoginFlags} from '../login/login'
import {createProject} from '../project/createProject'
import {bootstrapLocalTemplate} from './bootstrapLocalTemplate'
import {bootstrapRemoteTemplate} from './bootstrapRemoteTemplate'
import {type GenerateConfigOptions} from './createStudioConfig'
import {determineAppTemplate} from './determineAppTemplate'
import {absolutify, validateEmptyPath} from './fsUtils'
import {tryGitInit} from './git'
import {promptForDatasetName} from './promptForDatasetName'
import {promptForAclMode, promptForDefaultConfig, promptForTypeScript} from './prompts'
import {
  promptForAppendEnv,
  promptForEmbeddedStudio,
  promptForNextTemplate,
  promptForStudioPath,
} from './prompts/nextjs'
import {readPackageJson} from './readPackageJson'
import templates from './templates'
import {
  sanityCliTemplate,
  sanityConfigTemplate,
  sanityFolder,
  sanityStudioTemplate,
} from './templates/nextjs'

// eslint-disable-next-line no-process-env
const isCI = Boolean(process.env.CI)

/**
 * @deprecated - No longer used
 */
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
  appLocation?: string
  scripts?: Record<string, string>
}

export interface ProjectOrganization {
  id: string
  name: string
  slug: string
}

interface OrganizationCreateResponse {
  id: string
  name: string
  createdByUserId: string
  slug: string | null
  defaultRoleName: string | null
  members: unknown[]
  features: unknown[]
}

// eslint-disable-next-line max-statements, complexity
export default async function initSanity(
  args: CliCommandArguments<InitFlags>,
  context: CliCommandContext & {
    detectedFramework: Awaited<ReturnType<typeof detectFrameworkRecord>>
  },
): Promise<void> {
  const {output, prompt, workDir, apiClient, chalk, telemetry, detectedFramework} = context

  const trace = telemetry.trace(CLIInitStepCompleted)

  const cliFlags = args.extOptions
  const unattended = cliFlags.y || cliFlags.yes
  const print = unattended ? noop : output.print
  const success = output.success
  const warn = output.warn

  const intendedPlan = cliFlags['project-plan']
  const intendedCoupon = cliFlags.coupon
  const reconfigure = cliFlags.reconfigure
  const commitMessage = cliFlags.git
  const useGit = typeof commitMessage === 'undefined' ? true : Boolean(commitMessage)
  const bareOutput = cliFlags.bare
  const env = cliFlags.env
  const packageManager = cliFlags['package-manager']

  let remoteTemplateInfo: RepoInfo | undefined
  if (cliFlags.template && checkIsRemoteTemplate(cliFlags.template)) {
    remoteTemplateInfo = await getGitHubRepoInfo(cliFlags.template, cliFlags['template-token'])
  }

  let defaultConfig = cliFlags['dataset-default']
  let showDefaultConfigPrompt = !defaultConfig

  trace.start()
  trace.log({
    step: 'start',
    flags: {
      defaultConfig,
      unattended,
      plan: intendedPlan,
      coupon: intendedCoupon,
      reconfigure,
      git: commitMessage,
      bare: bareOutput,
      env,
    },
  })

  if (detectedFramework && detectedFramework.slug !== 'sanity' && remoteTemplateInfo) {
    throw new Error(
      `A remote template cannot be used with a detected framework. Detected: ${detectedFramework.name}`,
    )
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
      if (err.statusCode == '404') {
        const useDefaultPlan =
          unattended ??
          (await prompt.single({
            type: 'confirm',
            message: `Coupon "${intendedCoupon}" is not available, use default plan instead?`,
            default: true,
          }))
        if (unattended) {
          output.warn(`Coupon "${intendedCoupon}" is not available - using default plan`)
        }
        trace.log({
          step: 'useDefaultPlanCoupon',
          selectedOption: useDefaultPlan ? 'yes' : 'no',
          coupon: intendedCoupon,
        })
        if (useDefaultPlan) {
          print(`Using default plan.`)
        } else {
          throw new Error(`Coupon "${intendedCoupon}" does not exist`)
        }
      } else {
        throw new Error(`Unable to validate coupon, please try again later:\n\n${err.message}`)
      }
    }
  } else if (intendedPlan) {
    try {
      selectedPlan = await getPlanFromId(apiClient, intendedPlan)
    } catch (err) {
      if (err.statusCode == '404') {
        const useDefaultPlan =
          unattended ??
          (await prompt.single({
            type: 'confirm',
            message: `Project plan "${intendedPlan}" does not exist, use default plan instead?`,
            default: true,
          }))
        if (unattended) {
          output.warn(`Project plan "${intendedPlan}" does not exist - using default plan`)
        }
        trace.log({
          step: 'useDefaultPlanId',
          selectedOption: useDefaultPlan ? 'yes' : 'no',
          planId: intendedPlan,
        })
        if (useDefaultPlan) {
          print(`Using default plan.`)
        } else {
          throw new Error(`Plan id "${intendedPlan}" does not exist`)
        }
      } else {
        throw new Error(`Unable to validate plan, please try again later:\n\n${err.message}`)
      }
    }
  }

  if (reconfigure) {
    throw new Error('`--reconfigure` is deprecated - manual configuration is now required')
  }

  let envFilenameDefault = '.env'
  if (detectedFramework && detectedFramework.slug === 'nextjs') {
    envFilenameDefault = '.env.local'
  }
  const envFilename = typeof env === 'string' ? env : envFilenameDefault
  if (!envFilename.startsWith('.env')) {
    throw new Error('Env filename must start with .env')
  }

  // If the user isn't already authenticated, make it so
  const userConfig = getUserConfig()
  const hasToken = userConfig.get('authToken')

  debug(hasToken ? 'User already has a token' : 'User has no token')
  let user: SanityUser | undefined
  if (hasToken) {
    trace.log({step: 'login', alreadyLoggedIn: true})
    user = await getUserData(apiClient)
    success('You are logged in as %s using %s', user.email, getProviderName(user.provider))
  } else if (!unattended) {
    trace.log({step: 'login'})
    user = await getOrCreateUser()
  }

  // skip project / dataset prompting
  const isAppTemplate = cliFlags.template ? determineAppTemplate(cliFlags.template) : false // Default to false

  let introMessage = 'Fetching existing projects'
  if (cliFlags.quickstart) {
    introMessage = "Eject your existing project's Sanity configuration"
  }

  if (!isAppTemplate) {
    success(introMessage)
    print('')
  }

  const flags = await prepareFlags()

  // We're authenticated, now lets select or create a project (for studios) or org (for core apps)
  const {projectId, displayName, isFirstProject, datasetName, schemaUrl, organizationId} =
    await getProjectDetails()

  const sluggedName = deburr(displayName.toLowerCase())
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  // If user doesn't want to output any template code
  if (bareOutput) {
    success('Below are your project details')
    print('')
    print(`Project ID: ${chalk.cyan(projectId)}`)
    print(`Dataset: ${chalk.cyan(datasetName)}`)
    print(
      `\nYou can find your project on Sanity Manage — https://www.sanity.io/manage/project/${projectId}\n`,
    )
    return
  }

  let initNext = false
  const isNextJs = detectedFramework?.slug === 'nextjs'
  if (isNextJs) {
    initNext = await prompt.single({
      type: 'confirm',
      message:
        'Would you like to add configuration files for a Sanity project in this Next.js folder?',
      default: true,
    })
    trace.log({
      step: 'useDetectedFramework',
      selectedOption: initNext ? 'yes' : 'no',
      detectedFramework: detectedFramework?.name,
    })
  }

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

  if (isNextJs) {
    const packageJson = readPackageJson(`${outputPath}/package.json`)
    const reactVersion = packageJson?.dependencies?.react

    if (reactVersion) {
      const isUsingReact19 = semver.coerce(reactVersion)?.major === 19
      const isUsingNextJs15 = semver.coerce(detectedFramework?.detectedVersion)?.major === 15

      if (isUsingNextJs15 && isUsingReact19) {
        warn('╭────────────────────────────────────────────────────────────╮')
        warn('│                                                            │')
        warn('│ It looks like you are using Next.js 15 and React 19        │')
        warn('│ Please read our compatibility guide.                       │')
        warn('│ https://www.sanity.io/help/react-19                        │')
        warn('│                                                            │')
        warn('╰────────────────────────────────────────────────────────────╯')
      }
    }
  }

  if (initNext) {
    const useTypeScript = unattended ? true : await promptForTypeScript(prompt)
    trace.log({step: 'useTypeScript', selectedOption: useTypeScript ? 'yes' : 'no'})
    const fileExtension = useTypeScript ? 'ts' : 'js'

    const embeddedStudio = unattended ? true : await promptForEmbeddedStudio(prompt)
    let hasSrcFolder = false

    if (embeddedStudio) {
      // find source path (app or src/app)
      const appDir = 'app'
      let srcPath = path.join(workDir, appDir)

      if (!existsSync(srcPath)) {
        srcPath = path.join(workDir, 'src', appDir)
        hasSrcFolder = true
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
        `[[...tool]]/page.${fileExtension}x`,
      )

      // this selects the correct template string based on whether the user is using the app or pages directory and
      // replaces the ":configPath:" placeholder in the template with the correct path to the sanity.config.ts file.
      // we account for the user-defined embeddedStudioPath (default /studio) is accounted for by creating enough "../"
      // relative paths to reach the root level of the project
      await writeOrOverwrite(
        embeddedStudioRouteFilePath,
        sanityStudioTemplate.replace(
          ':configPath:',
          new Array(countNestedFolders(embeddedStudioRouteFilePath.slice(workDir.length)))
            .join('../')
            .concat('sanity.config'),
        ),
      )

      const sanityConfigPath = path.join(workDir, `sanity.config.${fileExtension}`)
      await writeOrOverwrite(
        sanityConfigPath,
        sanityConfigTemplate(hasSrcFolder)
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
      srcFolderPrefix?: boolean,
    ) => {
      for (const [filePath, content] of Object.entries(files)) {
        // check if file ends with full stop to indicate it's file and not directory (this only works with our template tree structure)
        if (filePath.includes('.') && typeof content === 'string') {
          await writeOrOverwrite(
            path.join(
              workDir,
              srcFolderPrefix ? 'src' : '',
              'sanity',
              folderPath || '',
              `${filePath}${fileExtension}`,
            ),
            content,
          )
        } else {
          await fs.mkdir(path.join(workDir, srcFolderPrefix ? 'src' : '', 'sanity', filePath), {
            recursive: true,
          })
          if (typeof content === 'object') {
            await writeSourceFiles(content, filePath, srcFolderPrefix)
          }
        }
      }
    }

    // ask what kind of schema setup the user wants
    const templateToUse = unattended ? 'clean' : await promptForNextTemplate(prompt)

    await writeSourceFiles(sanityFolder(useTypeScript, templateToUse), undefined, hasSrcFolder)

    const appendEnv = unattended ? true : await promptForAppendEnv(prompt, envFilename)

    if (appendEnv) {
      await createOrAppendEnvVars(envFilename, detectedFramework, {log: true})
    }

    if (embeddedStudio) {
      const nextjsLocalDevOrigin = 'http://localhost:3000'
      const existingCorsOrigins = await apiClient({api: {projectId}}).request({
        method: 'GET',
        uri: '/cors',
      })
      const hasExistingCorsOrigin = existingCorsOrigins.some(
        (item: {origin: string}) => item.origin === nextjsLocalDevOrigin,
      )
      if (!hasExistingCorsOrigin) {
        await apiClient({api: {projectId}})
          .request({
            method: 'POST',
            url: '/cors',
            body: {origin: nextjsLocalDevOrigin, allowCredentials: true},
            maxRedirects: 0,
          })
          .then((res) => {
            print(
              res.id
                ? `Added ${nextjsLocalDevOrigin} to CORS origins`
                : `Failed to add ${nextjsLocalDevOrigin} to CORS origins`,
            )
          })
          .catch((error) => {
            print(`Failed to add ${nextjsLocalDevOrigin} to CORS origins`, error)
          })
      }
    }

    const {chosen} = await getPackageManagerChoice(workDir, {interactive: false})
    trace.log({step: 'selectPackageManager', selectedOption: chosen})
    const packages = ['@sanity/vision@3', 'sanity@3', '@sanity/image-url@1', 'styled-components@6']
    if (templateToUse === 'blog') {
      packages.push('@sanity/icons')
    }
    await installNewPackages(
      {
        packageManager: chosen,
        packages,
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
      await execa('npm', ['install', '--legacy-peer-deps', 'next-sanity@9'], execOptions)
    } else if (chosen === 'yarn') {
      await execa('npx', ['install-peerdeps', '--yarn', 'next-sanity@9'], execOptions)
    } else if (chosen === 'pnpm') {
      await execa('pnpm', ['install', 'next-sanity@9'], execOptions)
    }

    print(
      `\n${chalk.green('Success!')} Your Sanity configuration files has been added to this project`,
    )

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
  trace.log({step: 'selectProjectTemplate', selectedOption: templateName})
  const template = templates[templateName]
  if (!remoteTemplateInfo && !template) {
    throw new Error(`Template "${templateName}" not found`)
  }

  // Use typescript?
  let useTypeScript = true
  if (!remoteTemplateInfo && template) {
    const typescriptOnly = template.typescriptOnly === true
    if (!typescriptOnly && typeof cliFlags.typescript === 'boolean') {
      useTypeScript = cliFlags.typescript
    } else if (!typescriptOnly && !unattended) {
      useTypeScript = await promptForTypeScript(prompt)
      trace.log({step: 'useTypeScript', selectedOption: useTypeScript ? 'yes' : 'no'})
    }
  }

  // we enable auto-updates by default, but allow users to specify otherwise
  let autoUpdates = true
  if (typeof cliFlags['auto-updates'] === 'boolean') {
    autoUpdates = cliFlags['auto-updates']
  }

  // If the template has a sample dataset, prompt the user whether or not we should import it
  const shouldImport =
    !unattended && template?.datasetUrl && (await promptForDatasetImport(template.importPrompt))

  trace.log({step: 'importTemplateDataset', selectedOption: shouldImport ? 'yes' : 'no'})

  const [_, bootstrapPromise] = await Promise.allSettled([
    updateProjectCliInitializedMetadata(),
    bootstrapTemplate(),
  ])

  if (bootstrapPromise.status === 'rejected' && bootstrapPromise.reason instanceof Error) {
    throw bootstrapPromise.reason
  }

  let pkgManager: PackageManager

  // If the user has specified a package manager, and it's allowed use that
  if (packageManager && ALLOWED_PACKAGE_MANAGERS.includes(packageManager)) {
    pkgManager = packageManager
  } else {
    // Otherwise, try to find the most optimal package manager to use
    pkgManager = (
      await getPackageManagerChoice(outputPath, {
        prompt,
        interactive: unattended ? false : isInteractive,
      })
    ).chosen

    // only log warning if a package manager flag is passed
    if (packageManager) {
      output.warn(
        chalk.yellow(
          `Given package manager "${packageManager}" is not supported. Supported package managers are ${allowedPackageManagersString}.`,
        ),
      )
      output.print(`Using ${pkgManager} as package manager`)
    }
  }

  trace.log({step: 'selectPackageManager', selectedOption: pkgManager})

  // Now for the slow part... installing dependencies
  await installDeclaredPackages(outputPath, pkgManager, context)

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

    print('')
    print('If you want to delete the imported data, use')
    print(`  ${chalk.cyan(`npx sanity dataset delete ${datasetName}`)}`)
    print('and create a new clean dataset with')
    print(`  ${chalk.cyan(`npx sanity dataset create <name>`)}\n`)
  }

  const devCommandMap: Record<PackageManager, string> = {
    yarn: 'yarn dev',
    npm: 'npm run dev',
    pnpm: 'pnpm dev',
    bun: 'bun dev',
    manual: 'npm run dev',
  }
  const devCommand = devCommandMap[pkgManager]

  const isCurrentDir = outputPath === process.cwd()
  if (isCurrentDir) {
    print(`\n${chalk.green('Success!')} Now, use this command to continue:\n`)
    print(
      `${chalk.cyan(devCommand)} - to run ${isAppTemplate ? 'your Sanity application' : 'Sanity Studio'}\n`,
    )
  } else {
    print(`\n${chalk.green('Success!')} Now, use these commands to continue:\n`)
    print(`First: ${chalk.cyan(`cd ${outputPath}`)} - to enter project’s directory`)
    print(
      `Then: ${chalk.cyan(devCommand)} -to run ${isAppTemplate ? 'your Sanity application' : 'Sanity Studio'}\n`,
    )
  }

  print(`Other helpful commands`)
  print(`npx sanity docs - to open the documentation in a browser`)
  print(`npx sanity manage - to open the project settings in a browser`)
  print(`npx sanity help - to explore the CLI manual`)

  const sendInvite =
    isFirstProject &&
    (await prompt.single({
      type: 'confirm',
      message:
        'We have an excellent developer community, would you like us to send you an invitation to join?',
      default: true,
    }))

  if (sendInvite) {
    trace.log({step: 'sendCommunityInvite', selectedOption: sendInvite ? 'yes' : 'no'})
    // Intentionally leave the promise "dangling" since we don't want to stall while waiting for this
    apiClient({requireProject: false})
      .request({
        uri: '/invitations/community',
        method: 'POST',
      })
      .catch(noop)
  }

  trace.complete()

  async function getOrCreateUser() {
    warn('No authentication credentials found in your Sanity config')
    print('')

    // Provide login options (`sanity login`)
    const {extOptions, ...otherArgs} = args
    const loginArgs: CliCommandArguments<LoginFlags> = {...otherArgs, extOptions: {}}
    await login(loginArgs, {...context, telemetry: trace.newContext('login')})
    return getUserData(apiClient)
  }

  async function getProjectDetails(): Promise<{
    projectId: string
    datasetName: string
    displayName: string
    isFirstProject: boolean
    schemaUrl?: string
    organizationId?: string
  }> {
    // If we're doing a quickstart, we don't need to prompt for project details
    if (flags.quickstart) {
      debug('Fetching project details from Journey API')
      const data = await fetchJourneyConfig(apiClient, flags.quickstart)
      trace.log({
        step: 'fetchJourneyConfig',
        projectId: data.projectId,
        datasetName: data.datasetName,
        displayName: data.displayName,
        isFirstProject: data.isFirstProject,
      })
      return data
    }

    if (isAppTemplate) {
      const client = apiClient({requireUser: true, requireProject: false})
      const organizations = await client.request({uri: '/organizations'})

      const appOrganizationId = await getOrganizationId(organizations)

      return {
        projectId: '',
        displayName: '',
        datasetName: '',
        isFirstProject: false,
        organizationId: appOrganizationId,
      }
    }

    debug('Prompting user to select or create a project')
    const project = await getOrCreateProject()
    debug(`Project with name ${project.displayName} selected`)

    // Now let's pick or create a dataset
    debug('Prompting user to select or create a dataset')
    const dataset = await getOrCreateDataset({
      projectId: project.projectId,
      displayName: project.displayName,
      dataset: flags.dataset,
      aclMode: flags.visibility,
      defaultConfig: flags['dataset-default'],
    })
    debug(`Dataset with name ${dataset.datasetName} selected`)

    trace.log({
      step: 'createOrSelectDataset',
      selectedOption: dataset.userAction,
      datasetName: dataset.datasetName,
      visibility: flags.visibility as 'private' | 'public',
    })

    return {
      projectId: project.projectId,
      displayName: project.displayName,
      isFirstProject: project.isFirstProject,
      datasetName: dataset.datasetName,
    }
  }

  // eslint-disable-next-line complexity
  async function getOrCreateProject(): Promise<{
    projectId: string
    displayName: string
    isFirstProject: boolean
    userAction: 'create' | 'select'
  }> {
    const client = apiClient({requireUser: true, requireProject: false})
    let projects
    let organizations: ProjectOrganization[]

    try {
      const [allProjects, allOrgs] = await Promise.all([
        client.projects.list({includeMembers: false}),
        client.request({uri: '/organizations'}),
      ])
      projects = allProjects.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      organizations = allOrgs
    } catch (err) {
      if (unattended && flags.project) {
        return {
          projectId: flags.project,
          displayName: 'Unknown project',
          isFirstProject: false,
          userAction: 'select',
        }
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
        userAction: 'select',
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
      const projectName = await prompt.single({
        type: 'input',
        message: 'Project name:',
        default: 'My Sanity Project',
        validate(input) {
          if (!input || input.trim() === '') {
            return 'Project name cannot be empty'
          }

          if (input.length > 80) {
            return 'Project name cannot be longer than 80 characters'
          }

          return true
        },
      })

      return createProject(apiClient, {
        displayName: projectName,
        organizationId: await getOrganizationId(organizations),
        subscription: selectedPlan ? {planId: selectedPlan} : undefined,
        metadata: {coupon: intendedCoupon},
      }).then((response) => ({
        ...response,
        isFirstProject: isUsersFirstProject,
        userAction: 'create',
        coupon: intendedCoupon,
      }))
    }

    debug(`User has ${projects.length} project(s) already, showing list of choices`)

    const projectChoices = projects.map((project) => ({
      value: project.id,
      name: `${project.displayName} (${project.id})`,
    }))

    const selected = await prompt.single({
      message: 'Create a new project or select an existing one',
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
        userAction: 'create',
      }))
    }

    debug(`Returning selected project (${selected})`)
    return {
      projectId: selected,
      displayName: projects.find((proj) => proj.id === selected)?.displayName || '',
      isFirstProject: isUsersFirstProject,
      userAction: 'select',
    }
  }

  async function getOrCreateDataset(opts: {
    projectId: string
    displayName: string
    dataset?: string
    aclMode?: string
    defaultConfig?: boolean
  }): Promise<{datasetName: string; userAction: 'create' | 'select' | 'none'}> {
    if (opts.dataset && (isCI || unattended)) {
      return {datasetName: opts.dataset, userAction: 'none'}
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

      return {datasetName: opts.dataset, userAction: 'none'}
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
      return {datasetName: name, userAction: 'create'}
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
      return {datasetName: newDatasetName, userAction: 'create'}
    }

    debug(`Returning selected dataset (${selected})`)
    return {datasetName: selected, userAction: 'select'}
  }

  function promptForDatasetImport(message?: string) {
    return prompt.single({
      type: 'confirm',
      message: message || 'This template includes a sample dataset, would you like to use it?',
      default: true,
    })
  }

  function selectProjectTemplate() {
    // Make sure the --quickstart and --template are not used together
    if (flags.quickstart) {
      return 'quickstart'
    }

    const defaultTemplate = unattended || flags.template ? flags.template || 'clean' : null
    if (defaultTemplate) {
      return defaultTemplate
    }

    return prompt.single({
      message: 'Select project template',
      type: 'list',
      choices: [
        {
          value: 'clean',
          name: 'Clean project with no predefined schema types',
        },
        {
          value: 'blog',
          name: 'Blog (schema)',
        },
        {
          value: 'shopify',
          name: 'E-commerce (Shopify)',
        },
        {
          value: 'moviedb',
          name: 'Movie project (schema + sample data)',
        },
      ],
    })
  }

  async function updateProjectCliInitializedMetadata() {
    try {
      const client = apiClient({api: {projectId}})
      const project = await client.request<SanityProject>({uri: `/projects/${projectId}`})

      if (!project?.metadata?.cliInitializedAt) {
        await client.request({
          method: 'PATCH',
          uri: `/projects/${projectId}`,
          body: {metadata: {cliInitializedAt: new Date().toISOString()}},
        })
      }
    } catch (err) {
      // Non-critical update
      debug('Failed to update cliInitializedAt metadata')
    }
  }

  async function bootstrapTemplate() {
    const bootstrapVariables: GenerateConfigOptions['variables'] = {
      autoUpdates,
      dataset: datasetName,
      projectId,
      projectName: displayName || answers.projectName,
      organizationId,
    }

    if (remoteTemplateInfo) {
      return bootstrapRemoteTemplate(
        {
          outputPath,
          packageName: sluggedName,
          repoInfo: remoteTemplateInfo,
          bearerToken: cliFlags['template-token'],
          variables: bootstrapVariables,
        },
        context,
      )
    }

    return bootstrapLocalTemplate(
      {
        outputPath,
        packageName: sluggedName,
        templateName,
        schemaUrl,
        useTypeScript,
        variables: bootstrapVariables,
      },
      context,
    )
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

    if (
      cliFlags.quickstart &&
      (cliFlags.project || cliFlags.dataset || cliFlags.visibility || cliFlags.template)
    ) {
      const disallowed = ['project', 'dataset', 'visibility', 'template']
      const usedDisallowed = disallowed.filter((flag) => cliFlags[flag as keyof InitFlags])
      const usedDisallowedStr = usedDisallowed.map((flag) => `--${flag}`).join(', ')
      throw new Error(`\`--quickstart\` cannot be combined with ${usedDisallowedStr}`)
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

  async function createOrganization(
    props: {name?: string} = {},
  ): Promise<OrganizationCreateResponse> {
    const name =
      props.name ||
      (await prompt.single({
        type: 'input',
        message: 'Organization name:',
        default: user ? user.name : undefined,
        validate(input) {
          if (input.length === 0) {
            return 'Organization name cannot be empty'
          } else if (input.length > 100) {
            return 'Organization name cannot be longer than 100 characters'
          }
          return true
        },
      }))

    const spinner = context.output.spinner('Creating organization').start()
    const client = apiClient({requireProject: false, requireUser: true})
    const organization = await client.request({
      uri: '/organizations',
      method: 'POST',
      body: {name},
    })
    spinner.succeed()

    return organization
  }

  async function getOrganizationId(organizations: ProjectOrganization[]) {
    // In unattended mode, if the user hasn't specified an organization, sending null as
    // organization ID to the API will create a new organization for the user with their
    // user name. If they _have_ specified an organization, we'll use that.
    if (unattended || flags.organization) {
      return flags.organization || undefined
    }

    // If the user has no organizations, prompt them to create one with the same name as
    // their user, but allow them to customize it if they want
    if (organizations.length === 0) {
      return createOrganization().then((org) => org.id)
    }

    // If the user has organizations, let them choose from them, but also allow them to
    // create a new one in case they do not have access to any of them, or they want to
    // create a personal/other organization.
    debug(`User has ${organizations.length} organization(s), checking attach access`)
    const withGrantInfo = await getOrganizationsWithAttachGrantInfo(organizations)
    const withAttach = withGrantInfo.filter(({hasAttachGrant}) => hasAttachGrant)

    debug('User has attach access to %d organizations.', withAttach.length)
    const organizationChoices = [
      ...withGrantInfo.map(({organization, hasAttachGrant}) => ({
        value: organization.id,
        name: `${organization.name} [${organization.id}]`,
        disabled: hasAttachGrant ? false : 'Insufficient permissions',
      })),
      new prompt.Separator(),
      {value: '-new-', name: 'Create new organization'},
      new prompt.Separator(),
    ]

    // If the user only has a single organization (and they have attach access to it),
    // we'll default to that one. Otherwise, we'll default to the organization with the
    // same name as the user if it exists.
    const defaultOrganizationId =
      withAttach.length === 1
        ? withAttach[0].organization.id
        : organizations.find((org) => org.name === user?.name)?.id

    const chosenOrg = await prompt.single({
      message: 'Select organization:',
      type: 'list',
      default: defaultOrganizationId || undefined,
      choices: organizationChoices,
    })

    if (chosenOrg === '-new-') {
      return createOrganization().then((org) => org.id)
    }

    return chosenOrg || undefined
  }

  async function hasProjectAttachGrant(orgId: string) {
    const requiredGrantGroup = 'sanity.organization.projects'
    const requiredGrant = 'attach'

    const client = apiClient({requireProject: false, requireUser: true})
      .clone()
      .config({apiVersion: 'v2021-06-07'})

    const grants = await client.request({uri: `organizations/${orgId}/grants`})
    const group: {grants: {name: string}[]}[] = grants[requiredGrantGroup] || []
    return group.some(
      (resource) =>
        resource.grants && resource.grants.some((grant) => grant.name === requiredGrant),
    )
  }

  function getOrganizationsWithAttachGrantInfo(organizations: ProjectOrganization[]) {
    return pMap(
      organizations,
      async (organization) => ({
        hasAttachGrant: await hasProjectAttachGrant(organization.id),
        organization,
      }),
      {concurrency: 3},
    )
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
    const shouldPrependWarning = filename !== '.env.local' && !existingEnv.includes(warningComment)
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

  const planId = response[0].id
  if (!planId) {
    throw new Error('Unable to find a plan from coupon code')
  }
  return planId
}

async function getUserData(apiClient: CliApiClient): Promise<SanityUser> {
  return await apiClient({
    requireUser: true,
    requireProject: false,
  }).request({
    method: 'GET',
    uri: 'users/me',
  })
}

async function getPlanFromId(apiClient: CliApiClient, planId: string): Promise<string> {
  const response = await apiClient({
    requireUser: false,
    requireProject: false,
  }).request({
    method: 'GET',
    uri: `plans/${planId}`,
  })

  const id = response[0].id
  if (!id) {
    throw new Error(`Unable to find a plan with id ${planId}`)
  }
  return id
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
