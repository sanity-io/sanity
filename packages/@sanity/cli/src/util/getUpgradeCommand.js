import path from 'path'
import which from 'which'
import isInstalledGlobally from 'is-installed-globally'
import debug from '../debug'
import {name} from '../../package.json'

function getUpgradeCommand(options = {}) {
  let {cwd, workDir} = options
  cwd = cwd || process.cwd()
  workDir = workDir || cwd

  if (isInstalledGlobally && isInstalledUsingYarn()) {
    debug('CLI is installed globally with yarn')
    return `yarn global add ${name}`
  }

  if (isInstalledGlobally) {
    debug('CLI is installed globally with npm')
    return `npm install -g ${name}`
  }

  const cmds = cwd === workDir ? [] : [`cd ${path.relative(cwd, workDir)}`]
  const hasGlobalYarn = Boolean(which.sync('yarn', {nothrow: true}))
  if (hasGlobalYarn) {
    cmds.push(`yarn upgrade ${name}`)
  } else {
    cmds.push(`./node_modules/.bin/sanity upgrade ${name}`)
  }

  return cmds.join(' && ')
}

function isInstalledUsingYarn() {
  const isWindows = process.platform === 'win32'
  const yarnPath = isWindows
    ? path.join('Yarn', 'config', 'global')
    : path.join('.config', 'yarn', 'global')

  return __dirname.includes(yarnPath)
}

export default getUpgradeCommand
