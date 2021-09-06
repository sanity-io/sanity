import debug from 'debug'

const rootName = 'sanity-pte:'

export default debug(rootName)
export function debugWithName(name: string): debug.Debugger {
  const namespace = `${rootName}${name}`
  if (debug && debug.enabled(namespace)) {
    return debug(namespace)
  }
  return debug(rootName)
}
