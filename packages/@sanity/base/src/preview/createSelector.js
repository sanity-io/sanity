import props from 'promise-props'

export default function createSelector(fetchWithSelection) {
  function get(subject, path) {
    if (Array.isArray(path)) {
      const [head, ...tail] = path
      const nextSubject = subject[head]

      if (tail.length === 0) {
        // we've reached our destination
        return nextSubject
      }

      if (!nextSubject) {
        return undefined
      }

      if (nextSubject._type === 'reference') {
        return fetchWithSelection(nextSubject._ref, tail)
          .then(result => get(result, tail))
      }

      return get(nextSubject, tail)
    }
    return subject[path]
  }

  return function select(value, selection) {
    const keys = Object.keys(selection)
    return props(keys.reduce((acc, key) => {
      acc[key] = get(value, selection[key].split('.'))
      return acc
    }, {}))
  }
}
