import fsp from 'fs-promise'
import {readFileSync} from 'fs'
import path from 'path'
import gitConfigLocal from 'gitconfiglocal'
import gitUserInfo from 'git-user-info'
import promiseProps from 'promise-props-recursive'
import thenify from 'thenify'

export default (rootDir, {isPlugin}) => {
  const cwd = process.cwd()
  const isSanityRoot = rootDir === cwd

  return promiseProps({
    author: getUserInfo(),

    // Don't try to use git remote from main Sanity project for plugins
    gitRemote: isPlugin && isSanityRoot ? '' : resolveGitRemote(cwd),

    // Don't try to guess plugin name if we're initing from Sanity root
    projectName: isPlugin && isSanityRoot ? '' : path.basename(cwd),

    // If we're initing a plugin, don't use description from Sanity readme
    description: (isSanityRoot && !isPlugin && getProjectDescription(cwd)) || ''
  })
}

const getGitConfig = thenify(gitConfigLocal)
function resolveGitRemote(cwd) {
  return fsp.stat(path.join(cwd, '.git'))
    .then(() => getGitConfig(cwd))
    .then(cfg => cfg.remote && cfg.remote.origin && cfg.remote.origin.url)
    .catch(() => null)
}

function getUserInfo() {
  const user = gitUserInfo()
  if (!user) {
    return null
  }

  if (user.name && user.email) {
    return `${user.name} <${user.email}>`
  }

  return user.name
}

function getProjectDescription(outputDir) {
  // Try to grab a project description from a standard Github-generated readme
  try {
    const readme = readFileSync(path.join(outputDir, 'README.md'), {encoding: 'utf8'})
    const match = readme.match(/^# .*?\n+(\w.*?)(?:$|\n)/)
    return ((match && match[1]) || '').replace(/\.$/, '')
  } catch (err) {
    return ''
  }
}
