import {execute} from './execute'

function install(args) {
  return execute(['install'].concat(args || [], '--quiet'))
}

export default install
