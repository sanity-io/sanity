const hasOwn = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty)

module.exports = function createObservableCache() {
  const cache = Object.create(null)

  return {
    get(key) {
      return cache[key]
    },
    fetch(key, producerFn) {
      if (this.has(key)) {
        return this.get(key)
      }
      return put(key, producerFn())
    },
    remove(key) {
      delete cache[key]
    },
    has(key) {
      return hasOwn(cache, key)
    }
  }

  function put(key, value) {
    cache[key] = value
    return cache[key]
  }
}
