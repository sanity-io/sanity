import {Subscription} from 'rxjs'

export function createSubscriptionManager(...keys: string[]) {
  const registry: Record<string, Subscription> = {}
  function validate(key: string) {
    if (!keys.includes(key)) {
      throw new Error(`Invalid subscription key: "${key}". Must be one of: ${keys.join(', ')}`)
    }
  }
  function add(key: string, subscription: Subscription) {
    validate(key)
    if (registry[key]) {
      throw new Error(
        `Subscription already exists for key: ${key}. Did you mean to call .replace instead?`
      )
    }
    registry[key] = subscription
  }

  function unsubscribe(key: string) {
    validate(key)
    if (registry[key]) {
      registry[key].unsubscribe()
      delete registry[key]
    }
  }
  function replace(key: string, subscription: Subscription) {
    if (registry[key]) {
      unsubscribe(key)
    }
    add(key, subscription)
  }

  function unsubscribeAll() {
    keys.forEach((key) => unsubscribe(key))
  }

  return {
    add,
    replace,
    unsubscribe,
    unsubscribeAll,
  }
}
