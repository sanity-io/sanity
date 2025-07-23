import ConfigStore from 'configstore'

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
