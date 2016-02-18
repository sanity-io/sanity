import path from 'path'
import merge from 'lodash/merge'
import memoize from 'lodash/memoize'
import ConfigStore from 'configstore'
import {loadJson} from './safeJson'

const defaults = {
  'cli.update.interval': 21600 * 1000, // Every six hours
  'server': {
    staticPath: './static',
    port: 3910,
    hostname: 'localhost'
  }
}

const getConfig = memoize(cwd => {
  const localConfig = cwd && loadJson(path.join(cwd, 'sanity.json'))
  const config = localConfig ? merge({}, defaults, localConfig) : defaults
  return new ConfigStore('sanity', config, {globalConfigPath: true})
})

export default getConfig
