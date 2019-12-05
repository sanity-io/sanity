import ConfigStore from 'configstore'

const sanityEnv = (process.env.SANITY_INTERNAL_ENV || '').toLowerCase() // eslint-disable-line no-process-env
const defaults = {}
let config = null

const getUserConfig = () => {
  if (!config) {
    config = new ConfigStore(
      sanityEnv && sanityEnv !== 'production' ? `sanity-${sanityEnv}` : 'sanity',
      defaults,
      {globalConfigPath: true}
    )
  }

  return config
}

export default getUserConfig
