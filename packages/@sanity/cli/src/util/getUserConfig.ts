import ConfigStore from 'configstore'

// eslint-disable-next-line no-process-env
const sanityEnv = (process.env.SANITY_INTERNAL_ENV || '').toLowerCase()
const configName = sanityEnv && sanityEnv !== 'production' ? `sanity-${sanityEnv}` : 'sanity'
const defaults = {}
let config: ConfigStore

export const getUserConfig = (): ConfigStore => {
  if (!config) {
    config = new ConfigStore(configName, defaults, {globalConfigPath: true})
  }

  return config
}
