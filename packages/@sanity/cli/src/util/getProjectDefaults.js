import {readFileSync} from 'fs'
import path from 'path'
import gitConfigLocal from 'gitconfiglocal'
import gitUserInfo from 'git-user-info'
import promiseProps from 'promise-props-recursive'
import thenify from 'thenify'

export default cwd =>
  promiseProps({
    projectName: path.basename(cwd),
    gitRemote: resolveGitRemote(cwd),
    description: getProjectDescription(cwd).replace(/\.$/, ''),
    author: getUserInfo()
  })

const getGitConfig = thenify(gitConfigLocal)
function resolveGitRemote(cwd) {
  return getGitConfig(cwd).then(config => (
    config.remote && config.remote.origin && config.remote.origin.url
  )).catch(() => null)
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

function getProjectDescription(cwd) {
  try {
    const readme = readFileSync(path.join(cwd, 'README.md'), {encoding: 'utf8'})
    const match = readme.match(/^# .*?\n+(\w.*?)(?:$|\n)/)
    return (match && match[1]) || ''
  } catch (err) {
    return ''
  }
}
