import {execute} from './execute'

function getVersion(pkg) {
  return execute(['view', pkg, 'version', '--quiet']).then(res => res.stdout.trim())
}

export default getVersion
