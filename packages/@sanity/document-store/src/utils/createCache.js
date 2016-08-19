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
      cache[key] = producerFn()
      return cache[key]
    },
    remove(key) {
      delete cache[key]
    },
    has(key) {
      return hasOwn(cache, key)
    }
  }
}
