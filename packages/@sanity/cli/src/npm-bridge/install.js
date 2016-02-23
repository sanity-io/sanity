import {execute} from './execute'

export function install(args) {
  return execute(['install'].concat(args || [], '--quiet'))
}

export function uninstall(args) {
  return execute(['uninstall'].concat(args || [], '--quiet'))
}
