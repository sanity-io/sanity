import os from 'os'
import util from 'util'
import path from 'path'
import xdgBasedir from 'xdg-basedir'
import promiseProps from 'promise-props-recursive'
import {pick, omit} from 'lodash'
import type {SanityProject, SanityProjectMember} from '@sanity/client'
import {getCliToken} from '../../util/clientWrapper'
import {getUserConfig} from '../../util/getUserConfig'
import {printResult as printVersionsResult} from '../versions/printVersionResult'
import {
  findSanityModuleVersions,
  ModuleVersionResult,
} from '../../actions/versions/findSanityModuleVersions'
import {CliCommandAction, CliUserConfig, CliCommandContext, SanityJson} from '../../types'

export const printDebugInfo: CliCommandAction = async (args, context) => {
  const flags = args.extOptions
  const {user, globalConfig, projectConfig, project, versions} = await gatherInfo(context)
  const {chalk} = context

  // User info
  context.output.print('\nUser:')
  if (user instanceof Error) {
    context.output.print(`  ${chalk.red(user.message)}\n`)
  } else {
    printKeyValue(
      {
        ID: user.id,
        Name: user.name,
        Email: user.email,
        Roles: project ? project.userRoles : undefined,
      },
      context
    )
  }

  // Project info (API-based)
  if (project) {
    context.output.print('Project:')
    printKeyValue(
      {
        ID: project.id,
        'Display name': project.displayName,
        'Studio URL': project.studioHostname,
      },
      context
    )
  }

  // Auth info
  // eslint-disable-next-line no-process-env
  const authToken = process.env.SANITY_AUTH_TOKEN || globalConfig.authToken
  if (authToken) {
    context.output.print('Authentication:')
    printKeyValue(
      {
        'User type': globalConfig.authType || 'normal',
        'Auth token': flags.secrets ? authToken : `<redacted>`,
      },
      context
    )

    if (!flags.secrets) {
      context.output.print('  (run with --secrets to reveal token)\n')
    }
  }

  // Global configuration (user home dir config file)
  context.output.print(`Global config (${chalk.yellow(getGlobalConfigLocation())}):`)
  const globalCfg = omit(globalConfig, ['authType', 'authToken'])
  context.output.print(`  ${formatObject(globalCfg).replace(/\n/g, '\n  ')}\n`)

  // Project configuration (projectDir/sanity.json)
  if (projectConfig) {
    const configLocation = context.cliConfigPath
      ? ` (${chalk.yellow(path.relative(process.cwd(), context.cliConfigPath))})`
      : ''

    context.output.print(`Project config${configLocation}:`)
    context.output.print(`  ${formatObject(projectConfig).replace(/\n/g, '\n  ')}`)
  }

  // Print installed package versions
  if (versions) {
    context.output.print('\nPackage versions:')
    printVersionsResult(versions, (line) => context.output.print(`  ${line}`))
    context.output.print('')
  }
}

function formatObject(obj: Record<string, any>): string {
  return util.inspect(obj, {colors: true, depth: +Infinity})
}

function printKeyValue(obj: Record<string, any>, context: CliCommandContext): void {
  let printedLines = 0
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] !== 'undefined') {
      context.output.print(`  ${key}: ${formatObject(obj[key])}`)
      printedLines++
    }
  })

  if (printedLines > 0) {
    context.output.print('')
  }
}

interface Configs {
  globalConfig: CliUserConfig
  projectConfig: SanityJson
}

interface UserInfo {
  id: string
  name: string
  email: string
}

interface ProjectInfo {
  id: string
  displayName: string
  studioHostname?: string | null
  userRoles: string[]
}

interface ConfigsWithUser extends Configs {
  user: UserInfo | Error
}

interface DebugInfo extends ConfigsWithUser {
  project: ProjectInfo
  versions: ModuleVersionResult[]
}

interface SanityRole {
  name: string
  title: string
  description: string
}

interface SanityProjectWithRoles extends SanityProject {
  members: (SanityProjectMember & {roles: SanityRole[]})[]
}

async function gatherInfo(context: CliCommandContext): Promise<DebugInfo> {
  const baseInfo = await promiseProps<Configs>({
    globalConfig: gatherGlobalConfigInfo(),
    projectConfig: gatherProjectConfigInfo(context),
  })

  const withUser: ConfigsWithUser = {
    ...baseInfo,
    user: await gatherUserInfo(context, {
      projectBased: Boolean(baseInfo.projectConfig && baseInfo.projectConfig.api),
    }),
  }

  return promiseProps<DebugInfo>({
    project: gatherProjectInfo(context, withUser),
    versions: findSanityModuleVersions(context, {target: 'latest'}),
    ...withUser,
  })
}

function getGlobalConfigLocation(): string {
  const user = (os.userInfo().username || 'user').replace(/\\/g, '')
  const configDir = xdgBasedir.config || path.join(os.tmpdir(), user, '.config')
  return path.join(configDir, 'sanity', 'config.json')
}

function gatherGlobalConfigInfo(): CliUserConfig {
  return getUserConfig().all
}

function gatherProjectConfigInfo(context: CliCommandContext): SanityJson | {error: string} | null {
  const {cliConfig} = context
  if (cliConfig?.api?.projectId) {
    return cliConfig
  }

  return {
    error: `Missing required "api.projectId" key`,
  }
}

async function gatherProjectInfo(
  context: CliCommandContext,
  baseInfo: ConfigsWithUser
): Promise<ProjectInfo | null | Error> {
  const projectClient = context.apiClient({requireUser: false, requireProject: false})
  const projectId = projectClient.config().projectId
  const hasToken = Boolean(getCliToken())
  if (!projectId || !hasToken) {
    return null
  }

  const client = context
    .apiClient({requireUser: true, requireProject: false})
    .withConfig({apiVersion: '2023-06-06'})

  const projectInfo = await client.request<SanityProjectWithRoles>({url: `/projects/${projectId}`})
  if (!projectInfo) {
    return new Error(`Project specified in configuration (${projectId}) does not exist in API`)
  }

  const userId = baseInfo.user instanceof Error ? null : baseInfo.user.id
  const host = projectInfo.studioHost
  const member = (projectInfo.members || []).find((user) => user.id === userId)
  const hostname = host && `https://${host}.sanity.studio/`
  return {
    id: projectId,
    displayName: projectInfo.displayName,
    studioHostname: hostname,
    userRoles: member ? member.roles.map((role) => role.name) : ['<none>'],
  }
}

async function gatherUserInfo(
  context: CliCommandContext,
  options: {projectBased: boolean}
): Promise<UserInfo | Error> {
  const hasToken = Boolean(getCliToken())
  if (!hasToken) {
    return new Error('Not logged in')
  }

  const client = context.apiClient({requireUser: true, requireProject: options.projectBased})
  const userInfo = await client.users.getById('me')
  if (!userInfo) {
    return new Error('Token expired or invalid')
  }

  return pick(userInfo, ['id', 'name', 'email'])
}
