import debug from 'debug'

const rootName = 'scheduled-publishing:'

export default debug(rootName)

/**
 * @internal
 */
export function debugWithName(name: string): debug.Debugger {
  const namespace = `${rootName}${name}`
  if (debug && debug.enabled(namespace)) {
    return debug(namespace)
  }
  return debug(rootName)
}
