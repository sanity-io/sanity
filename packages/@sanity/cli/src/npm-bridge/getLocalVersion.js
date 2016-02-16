import {execute} from './execute'
import safeJson from '../util/safeJson'

const npmEnv = {
  env: Object.assign({}, process.env, { // eslint-disable-line no-process-env
    NPM_CONFIG_LOGLEVEL: 'silent',
    NPM_CONFIG_JSON: true,
    NPM_CONFIG_DEPTH: 1
  })
}

function getLocalVersion(pkg) {
  return execute(['ls'], npmEnv)
    .then(res => safeJson(res, {}))
    .then(mani => (
      mani
      && mani.dependencies
      && mani.dependencies[pkg]
      && mani.dependencies[pkg].version
    ))
    .catch(() => false)
}

export default getLocalVersion
