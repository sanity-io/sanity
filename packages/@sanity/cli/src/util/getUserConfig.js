import ConfigStore from 'configstore'

const defaults = {}
let config = null

const getUserConfig = () => {
  if (!config) {
    config = new ConfigStore('sanity', defaults, {globalConfigPath: true})
  }

  return config
}

export default getUserConfig
