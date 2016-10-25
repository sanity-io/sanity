import execa from 'execa'
import {parseJson} from '../util/safeJson'

const npmEnv = {
  env: Object.assign({}, process.env, { // eslint-disable-line no-process-env
    NPM_CONFIG_LOGLEVEL: 'silent',
    NPM_CONFIG_JSON: true,
    NPM_CONFIG_DEPTH: 1
  })
}

function execute(args, opts) {
  const options = opts || npmEnv
  return execa('npm', args, {
    cwd: opts.rootDir || process.cwd(),
    ...options
  })
}

function getLocalVersion(pkg, opts = {}) {
  const options = Object.assign({}, npmEnv, opts)

  return execute(['ls'], npmEnv, options)
    .then(res => parseJson(res.stdout, {}))
    .then(mani => (
      mani
      && mani.dependencies
      && mani.dependencies[pkg]
      && mani.dependencies[pkg].version
    ))
    .catch(() => false)
}

export default getLocalVersion
