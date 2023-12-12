/* eslint-disable no-process-env */
import boxen from 'boxen'
import chalk from 'chalk'
import latestVersion from 'get-latest-version'
import semverCompare from 'semver-compare'
import pTimeout from 'p-timeout'
import type {PackageJson} from '../types'
import {getCliUpgradeCommand} from '../packageManager'
import {debug} from '../debug'
import {getUserConfig} from './getUserConfig'
import {isCi} from './isCi'

const MAX_BLOCKING_TIME = 300
const TWELVE_HOURS = 1000 * 60 * 60 * 12
const isDisabled =
  isCi || // Running in CI environment
  process.env.NO_UPDATE_NOTIFIER // Explicitly disabled

interface UpdateCheckOptions {
  pkg: PackageJson
  cwd: string
  workDir: string
}

export function runUpdateCheck(options: UpdateCheckOptions): {notify: () => Promise<void>} {
  debug('CLI installed at %s', __dirname)

  const {pkg, cwd, workDir} = options
  const {name, version} = pkg
  const userConfig = getUserConfig()
  const check = getLatestRemote().catch((): false => false)
  let hasPrintedResult = false

  return {notify}

  async function notify() {
    if (!process.stdout.isTTY) {
      return
    }

    const result = await pTimeout(check, MAX_BLOCKING_TIME, printCachedResult)
    if (hasPrintedResult) {
      debug('Has already printed result through timeout check, skipping result notification')
      return
    }

    printResult(result)
  }

  async function printCachedResult(): Promise<false> {
    debug('Max time (%dms) reached waiting for latest version info', MAX_BLOCKING_TIME)
    hasPrintedResult = true

    const cached = userConfig.get('cliHasUpdate')
    if (!cached) {
      debug('No cached latest version result found')
      return false
    }

    const diff = semverCompare(cached, version)
    if (diff <= 0) {
      // Looks like CLI was upgraded since last check
      debug('CLI was upgraded since last check, falling back')
      userConfig.delete('cliHasUpdate')
      return false
    }

    debug('Printing cached latest version result')
    await printResult(cached)
    return false
  }

  async function printResult(newVersion: string | false) {
    hasPrintedResult = true

    const lastUpdated = userConfig.get('cliLastUpdateNag') || 0
    if (Date.now() - lastUpdated < TWELVE_HOURS) {
      debug('Less than 12 hours since last nag, skipping')
      return
    }

    if (!newVersion || semverCompare(newVersion, version) <= 0) {
      debug(`New version is ${newVersion || 'unknown'}, current is ${version}. Falling back.`)
      return
    }

    const upgradeCommand = await getCliUpgradeCommand({cwd, workDir})
    const message = [
      'Update available ',
      chalk.dim(version),
      chalk.reset(' → '),
      chalk.green(newVersion),
      ' \nRun ',
      chalk.cyan(upgradeCommand),
      ' to update',
    ].join('')

    const boxenOpts = {
      padding: 1,
      margin: 1,
      borderColor: 'yellow',

      // Typescript issues forcing these to any
      align: 'center' as any,
      borderStyle: 'round' as any,
    }

    // Print to stderr to prevent garbling command output
    // eslint-disable-next-line no-console
    console.error(`\n${boxen(message, boxenOpts)}`)

    userConfig.set('cliLastUpdateNag', Date.now())
  }

  async function getLatestRemote(): Promise<false | string> {
    if (isDisabled) {
      debug('Running on CI, or explicitly disabled, skipping update check')
      return false
    }

    const lastUpdated = userConfig.get('cliLastUpdateCheck') || 0
    if (Date.now() - lastUpdated < TWELVE_HOURS) {
      debug('Less than 12 hours since last check, skipping update check')
      return userConfig.get('cliHasUpdate') || false
    }

    let latestRemote: string | undefined
    try {
      debug('Checking for latest remote version')
      latestRemote = await latestVersion(name)
      debug('Latest remote version is %s', latestRemote)
    } catch (err) {
      debug(`Failed to fetch latest version of ${name} from npm:\n${err.stack}`)
      return false
    }

    if (!latestRemote) {
      debug(`Failed to fetch latest version of ${name} from npm`)
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
