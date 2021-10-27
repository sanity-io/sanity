/* eslint-disable @typescript-eslint/ban-types */

// `WeakMap`s require the first type param to extend `object`
const bindCache = new WeakMap<object, Map<string, Function>>()

/**
 * An alternative to `obj.method.bind(obj)` that utilizes a weakmap to return
 * the same memory reference for sequent binds.
 */
export function memoBind<
  T extends object,
  K extends keyof {[P in keyof T]: T[P] extends Function ? T[P] : never}
>(obj: T, methodKey: K): T[K]
export function memoBind(obj: Record<string, unknown>, methodKey: string): Function {
  const boundMethods = bindCache.get(obj) || new Map<string, Function>()
  if (boundMethods) {
    const bound = boundMethods.get(methodKey)
    if (bound) return bound
  }

  const method = obj[methodKey]

  if (typeof method !== 'function') {
    throw new Error(
      `Expected property \`${methodKey}\` to be a function but got ${typeof method} instead.`
    )
  }

  const bound = method.bind(obj)
  boundMethods.set(methodKey, bound)
  bindCache.set(obj, boundMethods)

  return bound
}
