import props from 'promise-props'

export default function createSelector(fetchWithSelection) {
  function get(subject, path) {
    if (typeof path === 'string') {
      return get(subject, path.split('.'))
    }

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
    if (typeof selection === 'string') {
      return get(value, selection)
    }
    if (Array.isArray(selection)) {
      return Promise.all(selection.map(s => get(value, s)))
    }

    const keys = Object.keys(selection)
    return props(keys.reduce((acc, key) => {
      acc[key] = select(value, selection[key])
      return acc
    }, {}))
  }
}
