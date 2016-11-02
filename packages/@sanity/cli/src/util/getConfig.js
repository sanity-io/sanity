import path from 'path'
import merge from 'lodash/merge'
import {loadJsonSync} from './safeJson'
import get from 'lodash/get'

const defaults = {
  server: {
    staticPath: './static',
    port: 3910,
    hostname: 'localhost'
  }
}

const configContainer = values => ({
  get: (dotPath, defaultValue) =>
    get(values, dotPath, defaultValue)
})

const getConfig = rootDir => {
  const localConfig = rootDir && loadJsonSync(path.join(rootDir, 'sanity.json'))
  const config = localConfig ? merge({}, defaults, localConfig) : defaults

  return configContainer(config)
}

export default getConfig
