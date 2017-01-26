import merge from 'lodash.merge'

const isStaging = process.env.SANITY_STAGING // eslint-disable-line no-process-env

export default (rawConfig, env = 'development', sanityStaging = isStaging) => {
  const stagingConf = sanityStaging ? {api: {apiHost: 'https://api.sanity.work'}} : {}
  const envConfig = (rawConfig.env || {})[env] || {}
  const config = merge({}, rawConfig, envConfig, stagingConf)
  delete config.env
  return config
}
