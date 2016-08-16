import {execute} from './execute'

export function install(args, opts = {}) {
  return execute(['install'].concat(args || [], '--quiet'), opts)
}

export function uninstall(args, opts = {}) {
  return execute(['uninstall'].concat(args || [], '--quiet'), opts)
}
