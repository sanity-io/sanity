import {randomKey} from './randomKey'

function hasKey<T extends {_key?: string}>(item: T): item is T & {_key: string} {
  return item._key !== undefined
}

export function ensureKey<T extends {_key?: string}>(item: T): T & {_key: string} {
  return hasKey(item) ? item : {...item, _key: randomKey(12)}
}
