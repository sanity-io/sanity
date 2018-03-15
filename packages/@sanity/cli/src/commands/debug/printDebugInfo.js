import os from 'os'
import util from 'util'
import path from 'path'
import osenv from 'osenv'
import fse from 'fs-extra'
import xdgBasedir from 'xdg-basedir'
import promiseProps from 'promise-props-recursive'
import {pick, omit} from 'lodash'
import getUserConfig from '../../util/getUserConfig'
import {printResult as printVersionsResult} from '../versions/printVersionResult'
import findSanityModuleVersions from '../../actions/versions/findSanityModuleVersions'

export default async (args, context) => {
  const {user, globalConfig, projectConfig, project, versions} = await gatherInfo(context)
  const {chalk} = context

  // User info
  context.output.print('\nUser:')
  if (user instanceof Error) {
    context.output.print(`  ${chalk.red(user.message)}\n`)
  } else {
    printKeyValue({ID: user.id, Name: user.name, Email: user.email}, context)
  }

  // Project info (API-based)
  if (project) {
    context.output.print('Project:')
    printKeyValue(
      {
        ID: project.id,
        'Display name': project.displayName,
        'Studio URL': project.studioHostname || project.studioHost,
        'User role': project.userRole
      },
      context
    )
  }

  // Auth info
  if (globalConfig.authToken) {
    context.output.print('Authentication:')
    printKeyValue(
      {
        'User type': globalConfig.authType || 'normal',
        'Auth token': globalConfig.authToken
      },
      context
    )
  }

  // Global configuration (user home dir config file)
  context.output.print(`Global config (${chalk.yellow(getGlobalConfigLocation())}):`)
  const globalCfg = omit(globalConfig, ['authType', 'authToken'])
  context.output.print(`  ${formatObject(globalCfg).replace(/\n/g, '\n  ')}\n`)

  // Project configuration (projectDir/sanity.json)
  if (projectConfig) {
    const configLocation = path.join(context.workDir, 'sanity.json')
    context.output.print(`Project config (${chalk.yellow(configLocation)}):`)
    context.output.print(`  ${formatObject(projectConfig).replace(/\n/g, '\n  ')}`)
  }

  // Print installed package versions
  if (versions) {
    context.output.print('\nPackage versions:')
    printVersionsResult(versions, line => context.output.print(`  ${line}`))
    context.output.print('')
  }
}

function formatObject(obj) {
  return util.inspect(obj, {colors: true, depth: +Infinity})
}

function printKeyValue(obj, context) {
  let printedLines = 0
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] !== 'undefined') {
      context.output.print(`  ${key}: ${formatObject(obj[key])}`)
      printedLines++
    }
  })

  if (printedLines > 0) {
    context.output.print('')
  }
}

async function gatherInfo(context) {
  const baseInfo = await promiseProps({
    globalConfig: gatherGlobalConfigInfo(context),
    projectConfig: gatherProjectConfigInfo(context)
  })

  baseInfo.user = await gatherUserInfo(context, {
    projectBased: Boolean(baseInfo.projectConfig && baseInfo.projectConfig.api)
  })

  return promiseProps(
    Object.assign(
      {
        project: gatherProjectInfo(context, baseInfo),
        versions: findSanityModuleVersions(context)
      },
      baseInfo
    )
  )
}

function getGlobalConfigLocation() {
  const user = (osenv.user() || 'user').replace(/\\/g, '')
  const configDir = xdgBasedir.config || path.join(os.tmpdir(), user, '.config')
  return path.join(configDir, 'sanity', 'config.json')
}

function gatherGlobalConfigInfo(context) {
  return getUserConfig().all
}

async function gatherProjectConfigInfo(context) {
  const workDir = context.workDir
  const configLocation = path.join(workDir, 'sanity.json')

  try {
    const config = await fse.readJson(configLocation)
    if (!config.api || !config.api.projectId) {
      throw new Error(
        `Project config (${configLocation}) does not contain required "api.projectId" key`
      )
    }

    return config
  } catch (err) {
    return err.code === 'ENOENT' ? null : {error: err}
  }
}

async function gatherProjectInfo(context, baseInfo) {
  const client = context.apiClient({requireUser: false, requireProject: false})
  const projectId = client.config().projectId
  if (!projectId) {
    return null
  }

  const projectInfo = await client.projects.getById(projectId)
  if (!projectInfo) {
    return new Error(`Project specified in configuration (${projectId}) does not exist in API`)
  }

  const host = projectInfo.studioHostname || projectInfo.studioHost
  const member = (projectInfo.members || []).find(user => user.id === baseInfo.user.id)
  const hostname = host && `https://${host}.sanity.studio/`
  return {
    id: projectId,
    displayName: projectInfo.displayName,
    studioHostname: hostname,
    userRole: member ? member.role : 'unknown'
  }
}

async function gatherUserInfo(context, info = {}) {
  const client = context.apiClient({requireUser: false, requireProject: info.projectBased})
  const hasToken = Boolean(client.config().token)
  if (!hasToken) {
    return new Error('Not logged in')
  }

  const userInfo = await client.users.getById('me')
  if (!userInfo) {
    return new Error('Token expired or invalid')
  }

  return pick(userInfo, ['id', 'name', 'email'])
}
