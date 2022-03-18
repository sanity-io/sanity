import path from 'path'
import fs from 'fs/promises'
import getGitConfig from '@rexxars/gitconfiglocal'
import {getGitUserInfo} from 'git-user-info'
import promiseProps from 'promise-props-recursive'
import type {CliCommandContext} from '../types'
import {getCliToken} from './clientWrapper'

export interface ProjectDefaults {
  license: string
  author: string | undefined
  gitRemote: string
  projectName: string
  description: string
}

export function getProjectDefaults(
  workDir: string,
  {isPlugin, context}: {isPlugin: boolean; context: CliCommandContext}
): Promise<ProjectDefaults> {
  const cwd = process.cwd()
  const isSanityRoot = workDir === cwd

  return promiseProps({
    license: 'UNLICENSED',

    author: getUserInfo(context),

    // Don't try to use git remote from main Sanity project for plugins
    gitRemote: isPlugin && isSanityRoot ? '' : resolveGitRemote(cwd),

    // Don't try to guess plugin name if we're initing from Sanity root
    projectName: isPlugin && isSanityRoot ? '' : path.basename(cwd),

    // If we're initing a plugin, don't use description from Sanity readme
    description: getProjectDescription({isSanityRoot, isPlugin, outputDir: cwd}),
  })
}

async function resolveGitRemote(cwd: string): Promise<string | undefined> {
  try {
    await fs.stat(path.join(cwd, '.git'))
    const cfg = await getGitConfig(cwd)
    return cfg.remote && cfg.remote.origin && cfg.remote.origin.url
  } catch {
    return undefined
  }
}

async function getUserInfo(context: CliCommandContext): Promise<string | undefined> {
  const user = await getGitUserInfo()
  if (!user) {
    return getSanityUserInfo(context)
  }

  if (user.name && user.email) {
    return `${user.name} <${user.email}>`
  }

  return undefined
}

async function getSanityUserInfo(context: CliCommandContext): Promise<string | undefined> {
  const hasToken = Boolean(getCliToken())
  if (!hasToken) {
    return undefined
  }

  const client = context.apiClient({requireUser: true, requireProject: false})
  try {
    const user = await client.users.getById('me')
    return user ? `${user.name} <${user.email}>` : undefined
  } catch {
    return undefined
  }
}

async function getProjectDescription({
  isSanityRoot,
  isPlugin,
  outputDir,
}: {
  isSanityRoot: boolean
  isPlugin: boolean
  outputDir: string
}): Promise<string> {
  const tryResolve = isSanityRoot && !isPlugin
  if (!tryResolve) {
    return Promise.resolve('')
  }

  // Try to grab a project description from a standard GitHub-generated readme
  try {
    const readmePath = path.join(outputDir, 'README.md')
    const readme = await fs.readFile(readmePath, {encoding: 'utf8'})
    const match = readme.match(/^# .*?\n+(\w.*?)(?:$|\n)/)
    return ((match && match[1]) || '').replace(/\.$/, '') || ''
  } catch (err) {
    return ''
  }
}
