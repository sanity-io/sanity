/* eslint-disable no-process-env */
import fs from 'fs'
import path from 'path'
import {mergeWith, memoize} from 'lodash'
import dotenv from 'dotenv'

const readEnvFile = memoize(tryReadEnvFile)
const sanityEnv = process.env.SANITY_INTERNAL_ENV || 'production'
const basePath = process.env.SANITY_STUDIO_PROJECT_BASEPATH || process.env.STUDIO_BASEPATH
const apiHosts = {
  staging: 'https://api.sanity.work',
  development: 'http://api.sanity.wtf',
}

const processEnvConfig = {
  project: basePath ? {basePath} : {},
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

function tryReadEnvFile(pathName: string): {[key: string]: string} {
  let parsed = {}
  try {
    // eslint-disable-next-line no-sync
    parsed = dotenv.parse(fs.readFileSync(pathName, {encoding: 'utf8'}))
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // eslint-disable-next-line no-console
      console.error(`There was a problem processing the .env file (${pathName})`, err)
    }
  }

  return parsed
}

function tryReadDotEnv(studioRootPath: string, fallbackEnv?: string) {
  const configEnv = process.env.SANITY_ACTIVE_ENV || fallbackEnv || 'development'
  const envFile = path.join(studioRootPath, `.env.${configEnv}`)
  return readEnvFile(envFile)
}

export default (rawConfig, env = 'development', options: {studioRootPath?: string} = {}) => {
  const studioRootPath = options.studioRootPath

  let envVars = {...process.env}
  if (studioRootPath) {
    envVars = {...envVars, ...tryReadDotEnv(studioRootPath, env)}
  }

  const projectId = envVars.SANITY_STUDIO_API_PROJECT_ID
  const dataset = envVars.SANITY_STUDIO_API_DATASET

  const apiHost = apiHosts[sanityEnv]
  const api = clean({apiHost, projectId, dataset})
  const sanityConf = {api}
  const envConfig = (rawConfig.env || {})[env] || {}
  const config = mergeWith({}, rawConfig, envConfig, sanityConf, processEnvConfig, merge)
  delete config.env
  return config
}
