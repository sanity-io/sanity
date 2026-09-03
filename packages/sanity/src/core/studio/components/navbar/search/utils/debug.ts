import {createDebug, enabled, type Debugger} from 'obug'

import {DEBUG_FRAGMENT} from '../constants'

const rootName = 'core:studio:navbar:search:'

export function debugWithName(name: string): Debugger {
  const namespace = `${rootName}${name}`
  if (enabled(namespace)) {
    return createDebug(namespace)
  }
  return createDebug(rootName)
}

export function isDebugMode(): boolean {
  return typeof window === 'undefined'
    ? false
    : window.location.hash.slice(1).split(';').includes(DEBUG_FRAGMENT)
}
