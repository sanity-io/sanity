// `WeakMap`s require the first type param to extend `object`
// eslint-disable-next-line @typescript-eslint/ban-types
const randomIdCache = new WeakMap<object, string>()

/**
 * a simply random ID function. this doesn't need to be secure but should have a
 * decent amount of entropy
 */
function randomId(len = 8): string {
  if (len <= 0) return ''
  return Math.floor(Math.random() * 16).toString(16) + randomId(len - 1)
}

/**
 * given an object, this function randomly generates an ID and returns it. this
 * result is then saved in a WeakMap so subsequent requests for the same object
 * will receive the same ID
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function assignId(obj: object): string {
  const cachedValue = randomIdCache.get(obj)
  if (cachedValue) return cachedValue

  const id = randomId()
  randomIdCache.set(obj, id)
  return id
}
