import {execute} from './execute'

function install(pkg) {
  return execute(['install', '--quiet'])
}

export default install
