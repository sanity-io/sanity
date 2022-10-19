import debug from 'debug'
import {DEBUG_FRAGMENT} from '../constants'

const rootName = 'core:studio:navbar:search:'

export default debug(rootName)
export function debugWithName(name: string): debug.Debugger {
  const namespace = `${rootName}${name}`
  if (debug && debug.enabled(namespace)) {
    return debug(namespace)
  }
  return debug(rootName)
}

export function isDebugMode(): boolean {
  return typeof window === 'undefined'
    ? false
    : window.location.hash.slice(1).split(';').includes(DEBUG_FRAGMENT)
}
