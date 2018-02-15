/* eslint-disable no-process-env */
import path from 'path'
import which from 'which'
import boxen from 'boxen'
import chalk from 'chalk'
import latestVersion from 'latest-version'
import semverCompare from 'semver-compare'
import isInstalledGlobally from 'is-installed-globally'
import debug from '../debug'
import getUserConfig from './getUserConfig'

const MAX_BLOCKING_TIME = 250
const TWELVE_HOURS = 1000 * 60 * 60 * 12
const isDisabled =
  process.env.CI || // Travis CI, CircleCI, Gitlab CI, Appveyor, CodeShip
  process.env.CONTINUOUS_INTEGRATION || // Travis CI
  process.env.BUILD_NUMBER || // Jenkins, TeamCity
  process.env.NO_UPDATE_NOTIFIER // Explicitly disabled

module.exports = options => {
  debug('CLI installed at %s', __dirname)

  const {pkg, cwd, workDir} = options
  const {name, version} = pkg
  const userConfig = getUserConfig()
  const check = getLatestRemote().catch(() => false)
  let hasPrintedResult = false

  return {notify}

  async function notify() {
    if (!process.stdout.isTTY) {
      return
    }

    const maxWait = setTimeout(printCachedResult, MAX_BLOCKING_TIME)
    const result = await check
    if (hasPrintedResult) {
      return
    }

    clearTimeout(maxWait)
    printResult(result)
  }

  function printCachedResult() {
    debug('Max time reached waiting for latest version info')
    hasPrintedResult = true

    const cached = userConfig.get('cliHasUpdate')
    if (!cached) {
      debug('No cached latest version result found')
      return
    }

    const diff = semverCompare(cached, version)
    if (diff <= 0) {
      // Looks like CLI was upgraded since last check
      debug('CLI was upgraded since last check, falling back')
      userConfig.delete('cliHasUpdate')
      return
    }

    debug('Printing cached latest version result')
    printResult(cached)
  }

  function printResult(newVersion) {
    hasPrintedResult = true

    const lastUpdated = userConfig.get('cliLastUpdateNag') || 0
    if (Date.now() - lastUpdated < TWELVE_HOURS) {
      debug('Less than 12 hours since last nag, skipping')
      return
    }

    if (!newVersion) {
      return
    }

    const upgradeCommand = getUpgradeCommand(newVersion)
    const message = [
      'Update available ',
      chalk.dim(version),
      chalk.reset(' → '),
      chalk.green(newVersion),
      ' \nRun ',
      chalk.cyan(upgradeCommand),
      ' to update'
    ].join('')

    const boxenOpts = {
      padding: 1,
      margin: 1,
      align: 'center',
      borderColor: 'yellow',
      borderStyle: 'round'
    }

    // Print to stderr to prevent garbling command output
    // eslint-disable-next-line no-console
    console.error(`\n${boxen(message, boxenOpts)}`)

    userConfig.set('cliLastUpdateNag', Date.now())
  }

  function getUpgradeCommand(newVersion) {
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
      cmds.push('./node_modules/.bin/sanity upgrade @sanity/cli')
    }

    return cmds.join(' && ')
  }

  async function getLatestRemote() {
    if (isDisabled) {
      debug('Running on CI, or explicitly disabled, skipping update check')
      return false
    }

    const lastUpdated = userConfig.get('cliLastUpdateCheck') || 0
    if (Date.now() - lastUpdated < TWELVE_HOURS) {
      debug('Less than 12 hours since last check, skipping update check')
      return userConfig.get('cliHasUpdate') || false
    }

    let latestRemote
    try {
      latestRemote = await latestVersion(name)
      debug('Latest remote version is %s', latestRemote)
    } catch (err) {
      debug(`Failed to fetch latest version of ${name} from npm:\n${err.stack}`)
      return false
    }

    userConfig.set('cliLastUpdateCheck', Date.now())

    const diff = semverCompare(latestRemote, version)
    if (diff <= 0) {
      // No change, or lower
      debug(diff === 0 ? 'No update found' : 'Remote version older than local')
      userConfig.delete('cliHasUpdate')
      return false
    }

    // Update available, set to user config so we may notify on next startup
    userConfig.set('cliHasUpdate', latestRemote)
    debug('Update is available (%s)', latestRemote)
    return latestRemote
  }
}

function isInstalledUsingYarn() {
  const isWindows = process.platform === 'win32'
  const yarnPath = isWindows
    ? path.join('Yarn', 'config', 'global')
    : path.join('.config', 'yarn', 'global')

  return __dirname.includes(yarnPath)
}
