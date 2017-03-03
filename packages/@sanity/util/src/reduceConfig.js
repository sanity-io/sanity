import {mergeWith} from 'lodash'

const sanityEnv = process.env.SANITY_ENV || 'production' // eslint-disable-line no-process-env
const apiHosts = {
  staging: 'https://api.sanity.work',
  development: 'http://api.sanity.wtf'
}

function merge(objValue, srcValue, key) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue)
  }

  // Pass on to default merging strategy
  return undefined
}

export default (rawConfig, env = 'development') => {
  const apiHost = apiHosts[sanityEnv]
  const sanityConf = apiHost ? {api: {apiHost}} : {}
  const envConfig = (rawConfig.env || {})[env] || {}
  const config = mergeWith({}, rawConfig, envConfig, sanityConf, merge)
  delete config.env
  return config
}
