import {execute} from './execute'

function install() {
  return execute(['install', '--quiet'])
}

export default install
