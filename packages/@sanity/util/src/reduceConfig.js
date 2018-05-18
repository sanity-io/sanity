/* eslint-disable no-process-env */
import {mergeWith} from 'lodash'

const sanityEnv = process.env.SANITY_ENV || 'production'
const apiHosts = {
  staging: 'https://api.sanity.work',
  development: 'http://api.sanity.wtf'
}

const processEnvConfig = {
  project: process.env.STUDIO_BASEPATH ? {basePath: process.env.STUDIO_BASEPATH} : {}
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
  const config = mergeWith({}, rawConfig, envConfig, sanityConf, processEnvConfig, merge)
  delete config.env
  return config
}
