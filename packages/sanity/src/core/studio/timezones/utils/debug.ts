import {createDebug, enabled, type Debugger} from 'obug'

const rootName = 'scheduled-publishing:'

export function debugWithName(name: string): Debugger {
  const namespace = `${rootName}${name}`
  if (enabled(namespace)) {
    return createDebug(namespace)
  }
  return createDebug(rootName)
}
