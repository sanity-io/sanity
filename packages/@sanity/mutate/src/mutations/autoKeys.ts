import {type Index, type KeyedPathElement} from '../path'
import {isObject} from '../utils/isObject'
import {
  insert as _insert,
  replace as _replace,
  upsert as _upsert,
} from './operations/creators'
import {type RelativePosition} from './operations/types'

export function autoKeys<Item>(generateKey: (item: Item) => string) {
  const ensureKeys = createEnsureKeys(generateKey)

  const insert = <
    Pos extends RelativePosition,
    Ref extends Index | KeyedPathElement,
  >(
    position: Pos,
    referenceItem: Ref,
    items: Item[],
  ) => _insert(ensureKeys(items), position, referenceItem)
  const upsert = <
    Pos extends RelativePosition,
    ReferenceItem extends Index | KeyedPathElement,
  >(
    items: Item[],
    position: Pos,
    referenceItem: ReferenceItem,
  ) => _upsert(ensureKeys(items), position, referenceItem)

  const replace = <
    Pos extends RelativePosition,
    ReferenceItem extends Index | KeyedPathElement,
  >(
    items: Item[],
    position: Pos,
    referenceItem: ReferenceItem,
  ) => _replace(ensureKeys(items), referenceItem)

  const insertBefore = <Ref extends Index | KeyedPathElement>(
    ref: Ref,
    items: Item[],
  ) => insert('before', ref, items)

  const prepend = (items: Item[]) => insertBefore(0, items)

  const insertAfter = <Ref extends Index | KeyedPathElement>(
    ref: Ref,
    items: Item[],
  ) => insert('after', ref, items)

  const append = (items: Item[]) => insert('after', -1, items)

  return {insert, upsert, replace, insertBefore, prepend, insertAfter, append}
}

function hasKey<T extends object>(item: T): item is T & {_key: string} {
  return '_key' in item
}

function createEnsureKeys<T>(generateKey: (item: T) => string) {
  return (array: T[]): T[] => {
    let didModify = false
    const withKeys = array.map(item => {
      if (needsKey(item)) {
        didModify = true
        return {...item, _key: generateKey(item)}
      }
      return item
    })
    return didModify ? withKeys : array
  }
}

function needsKey(arrayItem: any): arrayItem is object {
  return isObject(arrayItem) && !hasKey(arrayItem)
}
