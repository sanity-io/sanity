import debug from 'debug'

const rootName = 'sanity-pte:'

export default debug('sanity-pte:')
export function debugWithName(name: string) {
  const namespace = `${rootName}${name}`
  if (debug && debug.enabled(namespace)) {
    return debug(namespace)
  }
  return debug(rootName)
}
