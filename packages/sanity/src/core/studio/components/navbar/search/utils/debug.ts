import {createDebug, enabled, type Debugger} from 'obug'

const rootName = 'core:studio:navbar:search:'

export function debugWithName(name: string): Debugger {
  const namespace = `${rootName}${name}`
  if (enabled(namespace)) {
    return createDebug(namespace)
  }
  return createDebug(rootName)
}
