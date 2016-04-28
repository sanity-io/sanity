import semverCompare from 'semver-compare'
import getVersion from '../npm-bridge/getVersion'
import pkg from '../../package.json'
import getConfig from './getConfig'
import debug from '../debug'

function checkForUpdates() {
  const config = getConfig()
  const interval = config.get('cli.update.interval')
  const lastCheck = config.get('cli.update.lastcheck') || 0

  if (Date.now() - lastCheck < interval) {
    // Recently checked for updates, fall back
    debug('Last update check was more recent than update interval, skipping')
    return Promise.resolve({skip: true})
  }

  debug(`Checking for new version of ${pkg.name}`)
  return getVersion(pkg.name).then(latest => ({
    atLatest: semverCompare(latest, pkg.version) === 0,
    current: pkg.version,
    latest
  })).then(info => {
    debug('Update check complete, setting "last check" timestamp')
    config.set('cli.update.lastcheck', Date.now())
    return info
  }).catch(err => {
    throw err
  })
}

export default checkForUpdates
