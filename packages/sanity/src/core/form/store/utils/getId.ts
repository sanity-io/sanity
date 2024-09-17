import {nanoid} from 'nanoid'

const idCache = new WeakMap<object, string>()
const undefinedKey = {key: 'GetIdUndefined'}
const nullKey = {key: 'GetIdNull'}

/**
 * Generates a stable ID for various types of values, including `undefined`, `null`, objects, functions, and symbols.
 *
 * - **Primitives (string, number, boolean):** The value itself is used as the ID.
 * - **Undefined and null:** Special symbols (`undefinedKey` and `nullKey`) are used to generate unique IDs.
 * - **Objects and functions:** An ID is generated using the `nanoid` library and cached in a `WeakMap` for stable future retrieval.
 *
 * This function is used to reconcile inputs in `prepareFormState` immutably, allowing IDs to be generated and cached based
 * on the reference of the object. This ensures that memoization functions can use these IDs for consistent hashing without
 * recalculating on each call, as the inputs themselves are immutably edited.
 *
 * @internal
 */
export function getId(value: unknown): string {
  switch (typeof value) {
    case 'undefined': {
      return getId(undefinedKey)
    }
    case 'function':
    case 'object':
    case 'symbol': {
      if (value === null) return getId(nullKey)

      const cached = idCache.get(value as object)
      if (cached) return cached

      const id = nanoid()
      idCache.set(value as object, id)
      return id
    }
    default: {
      return `${value}`
    }
  }
}
