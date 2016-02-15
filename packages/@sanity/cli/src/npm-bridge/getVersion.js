import {execute} from './execute'

function getVersion(pkg) {
  return execute(['view', pkg, 'version', '--quiet'])
}

export default getVersion
