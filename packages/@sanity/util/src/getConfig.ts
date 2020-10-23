import * as path from 'path'
import {get, merge} from 'lodash'
import {loadJsonSync} from './safeJson'
import reduceConfig from './reduceConfig'

const defaults = {
  server: {
    staticPath: './static',
    port: 3333,
    hostname: 'localhost',
  },
}

const configContainer = (values) => ({
  get: (dotPath, defaultValue) => get(values, dotPath, defaultValue),
})

const getConfig = (rootDir, options: {env?: string} = {}) => {
  const localConfig = rootDir && loadJsonSync(path.join(rootDir, 'sanity.json'))
  const config = reduceConfig(
    localConfig ? merge({}, defaults, localConfig) : defaults,
    options.env || process.env.NODE_ENV || 'development', // eslint-disable-line no-process-env
    {studioRootPath: rootDir}
  )

  return configContainer(config)
}

export default getConfig
