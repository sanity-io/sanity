import props from 'promise-props'
import {has} from 'lodash'

function resolveMissingPaths(value, paths) {
  return paths.filter(path => !has(value, path))
}

export default function createPreviewMaterializer(fetchWithPaths) {

  function follow(value, paths) {
    if (value._type === 'reference') {
      return fetchWithPaths(value._ref, paths).then(doc => follow(doc, paths))
    }

    const leads = {}
    paths.forEach(path => {
      const [head, ...tail] = path
      if (!leads[head]) {
        leads[head] = []
      }
      leads[head].push(tail)
    })

    return props(Object.keys(leads).reduce((res, head) => {
      const tails = leads[head]
      if (tails.every(tail => tail.length === 0)) {
        res[head] = value[head]
      } else {
        res[head] = follow(value[head] || {}, tails)
      }
      return res
    }, {...value}))
  }

  return function materialize(value, paths) {
    const missingPaths = resolveMissingPaths(value, paths)
    if (missingPaths.length === 0) {
      return value
    }
    const id = value._type === 'reference' ? value._ref : value._id
    if (id) {
      return fetchWithPaths(id, missingPaths)
        .then(res => ({...value, ...res}))
    }

    // No id means we are at a inline object. There still might be paths that needs fetching
    return follow(value, missingPaths)
  }
}
