import path from 'path'
import gitConfigLocal from 'gitconfiglocal'
import promiseProps from 'promise-props-recursive'
import thenify from 'thenify'

export default cwd =>
  promiseProps({
    gitRemote: resolveGitRemote(cwd),
    projectName: path.basename(cwd)
  })

const getGitConfig = thenify(gitConfigLocal)
function resolveGitRemote(cwd) {
  return getGitConfig(cwd).then(config => (
    config.remote && config.remote.origin && config.remote.origin.url
  ))
}
