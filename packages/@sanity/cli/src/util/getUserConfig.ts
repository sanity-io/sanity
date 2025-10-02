import ConfigStore from 'configstore'

const config: Record<string, ConfigStore> = {}

export const getUserConfig = (apiHost?: string): ConfigStore => {
  const sanityEnv =
    apiHost && apiHost.endsWith('.work')
      ? 'staging'
      : (process.env.SANITY_INTERNAL_ENV || '').toLowerCase()

  const configName = sanityEnv && sanityEnv !== 'production' ? `sanity-${sanityEnv}` : 'sanity'

  if (!config[configName]) {
    config[configName] = new ConfigStore(configName, {}, {globalConfigPath: true})
  }

  return config[configName]
}
