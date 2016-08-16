import {execute} from './execute'

function getVersion(pkg, opts = {}) {
  return execute(['view', pkg, 'version', '--quiet'], opts)
    .then(res => res.stdout.trim())
}

export default getVersion
