import merge from 'lodash.merge'

const sanityEnv = process.env.SANITY_ENV || 'production' // eslint-disable-line no-process-env
const apiHosts = {
  staging: 'https://api.sanity.work',
  development: 'http://api.sanity.wtf'
}

export default (rawConfig, env = 'development') => {
  const apiHost = apiHosts[sanityEnv]
  const sanityConf = apiHost ? {api: {apiHost}} : {}
  const envConfig = (rawConfig.env || {})[env] || {}
  const config = merge({}, rawConfig, envConfig, sanityConf)
  delete config.env
  return config
}
