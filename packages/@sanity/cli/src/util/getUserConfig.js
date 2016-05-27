import ConfigStore from 'configstore'

const defaults = {
  'cli.update.interval': 21600 * 1000 // Every six hours
}

const getUserConfig = () =>
  new ConfigStore('sanity', defaults, {globalConfigPath: true})

export default getUserConfig
