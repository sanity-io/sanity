import path from 'path'
import fse from 'fs-extra'
import gitConfigLocal from 'gitconfiglocal'
import gitUserInfo from 'git-user-info'
import promiseProps from 'promise-props-recursive'
import {promisify} from 'es6-promisify'

export default (workDir, {isPlugin, context}) => {
  const cwd = process.cwd()
  const isSanityRoot = workDir === cwd

  return promiseProps({
    author: getUserInfo(context),

    // Don't try to use git remote from main Sanity project for plugins
    gitRemote: isPlugin && isSanityRoot ? '' : resolveGitRemote(cwd),

    // Don't try to guess plugin name if we're initing from Sanity root
    projectName: isPlugin && isSanityRoot ? '' : path.basename(cwd),

    // If we're initing a plugin, don't use description from Sanity readme
    description: getProjectDescription({isSanityRoot, isPlugin, outputDir: cwd}),
  })
}

const getGitConfig = promisify(gitConfigLocal)
function resolveGitRemote(cwd) {
  return fse
    .stat(path.join(cwd, '.git'))
    .then(() => getGitConfig(cwd))
    .then((cfg) => cfg.remote && cfg.remote.origin && cfg.remote.origin.url)
    .catch(() => null)
}

function getUserInfo(context) {
  const user = gitUserInfo()
  if (!user) {
    return getSanityUserInfo(context)
  }

  if (user.name && user.email) {
    return `${user.name} <${user.email}>`
  }

  return undefined
}

function getSanityUserInfo(context) {
  const client = context.apiClient({requireUser: false, requireProject: false})
  const hasToken = Boolean(client.config().token)
  if (!hasToken) {
    return null
  }

  return client.users
    .getById('me')
    .then((user) => `${user.name} <${user.email}>`)
    .catch(() => null)
}

async function getProjectDescription({isSanityRoot, isPlugin, outputDir}) {
  const tryResolve = isSanityRoot && !isPlugin
  if (!tryResolve) {
    return Promise.resolve('')
  }

  // Try to grab a project description from a standard Github-generated readme
  try {
    const readmePath = path.join(outputDir, 'README.md')
    const readme = await fse.readFile(readmePath, {encoding: 'utf8'})
    const match = readme.match(/^# .*?\n+(\w.*?)(?:$|\n)/)
    return ((match && match[1]) || '').replace(/\.$/, '') || ''
  } catch (err) {
    return ''
  }
}
