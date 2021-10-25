import {nanoid} from 'nanoid'

// `WeakMap`s require the first type param to extend `object`
// eslint-disable-next-line @typescript-eslint/ban-types
const randomIdCache = new WeakMap<object, string>()

/**
 * given an object, this function randomly generates an ID and returns it. this
 * result is then saved in a WeakMap so subsequent requests for the same object
 * will receive the same ID
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function assignId(obj: object): string {
  const cachedValue = randomIdCache.get(obj)
  if (cachedValue) return cachedValue

  const id = nanoid()
  randomIdCache.set(obj, id)
  return id
}
