export default function create(...keys) {
  const registry = {}
  function validate(key) {
    if (!keys.includes(key)) {
      throw new Error(`Invalid subscription key: "${key}". Must be one of: ${keys.join(', ')}`)
    }
  }
  function add(key, subscription) {
    validate(key)
    if (registry[key]) {
      throw new Error(`Subscription already exists for key: ${key}. Did you mean to call .replace instead?`)
    }
    registry[key] = subscription
  }

  function unsubscribe(key) {
    validate(key)
    if (registry[key]) {
      registry[key].unsubscribe()
      registry[key] = null
    }
  }
  function replace(key, subscription) {
    if (registry[key]) {
      unsubscribe(key)
    }
    add(key, subscription)
  }

  function unsubscribeAll() {
    keys.forEach(key => unsubscribe(key))
  }

  return {
    add: add,
    replace: replace,
    unsubscribe: unsubscribe,
    unsubscribeAll: unsubscribeAll
  }
}
