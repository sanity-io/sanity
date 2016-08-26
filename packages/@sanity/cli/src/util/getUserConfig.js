import ConfigStore from 'configstore'

const defaults = {}

const getUserConfig = () =>
  new ConfigStore('sanity', defaults, {globalConfigPath: true})

export default getUserConfig
