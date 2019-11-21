/* eslint-disable no-process-env */
import {mergeWith} from 'lodash'

const sanityEnv = process.env.SANITY_ENV || 'production'
const basePath = process.env.SANITY_STUDIO_BASEPATH || process.env.STUDIO_BASEPATH
const apiHosts = {
  staging: 'https://api.sanity.work',
  development: 'http://api.sanity.wtf'
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || undefined
const dataset = process.env.SANITY_STUDIO_DATASET || undefined

const processEnvConfig = {
  project: basePath ? {basePath} : {}
}

function clean(obj) {
  return Object.keys(obj).reduce((acc, key) => (obj[key] ? {...acc, [key]: obj[key]} : acc), {})
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
  const api = clean({apiHost, projectId, dataset})
  const sanityConf = {api}
  const envConfig = (rawConfig.env || {})[env] || {}
  const config = mergeWith({}, rawConfig, envConfig, sanityConf, processEnvConfig, merge)
  delete config.env
  return config
}
