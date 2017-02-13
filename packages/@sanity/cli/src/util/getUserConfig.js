import ConfigStore from 'configstore'

const staging = typeof process.env.SANITY_STAGING !== 'undefined' // eslint-disable-line no-process-env
const defaults = {}
let config = null

const getUserConfig = () => {
  if (!config) {
    config = new ConfigStore(
      staging ? 'sanity-staging' : 'sanity',
      defaults,
      {globalConfigPath: true}
    )
  }

  return config
}

export default getUserConfig
