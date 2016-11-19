const Observable = require('zen-observable')
const debug = require('./debug')
const createCache = require('./createCache')

// Takes a cache key resolver and an observer-returning function and returns a new function that
// when called, will generate a cache key from the params using `getKey`. Caches a shared observable
// for each call that resolves to the same cache key and keeps this observable in the cache as long
// as there are subscribers. When the last subscriber unsubscribes, the cache key is then purged.

// Usage example:
// ```js
// const getDocument = canonicalize(id => id, id => {
//   console.log('creating observable')
//   return Observable.interval(1000)
// })
// ```
// const subscriber = getDocument(12).subscribe(log)
// const subscriber = getDocument(12).subscribe(log)
// Both subscription1 and subscription2 share the same observable and the function that creates the observable
// are called only once. For it to be called again, both subscribers have to unsubscribe

module.exports = function canonicalize(getKey, producerFn) {
  const cache = createCache()
  const refCounts = {}

  return canonicalized

  function canonicalized(...args) {
    return new Observable(observer => {
      const key = getKey(...args)
      refCounts[key] = (refCounts[key] || 0) + 1
      if (cache.has(key)) {
        debug('reusing cached observable for key #%s', key)
      }
      const cachedObservable = cache.fetch(key, () => {
        debug('calling producer for key #%s', key)
        return producerFn(...args)
      })
      const subscription = cachedObservable.subscribe(observer)
      return () => {
        refCounts[key]--
        if (refCounts[key] === 0) {
          debug('purging observable for key #%s', key)
          delete refCounts[key]
          cache.remove(key)
        }
        subscription.unsubscribe()
      }
    })
  }
}
