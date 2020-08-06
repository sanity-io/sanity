import {ArrayDiff, ArrayInput, Input, ItemDiff, DiffOptions, NoDiff} from '../types'
import {diffInput} from './diffInput'

export function diffArray<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  options: DiffOptions
): ArrayDiff<A> | NoDiff {
  const keyedA = indexByKey(fromInput)
  const keyedB = indexByKey(toInput)

  const items =
    keyedA && keyedB ? diffArrayByKey(keyedA, keyedB) : diffArrayByReinsert(fromInput, toInput)

  const fromValue = fromInput.value
  const toValue = toInput.value

  if (!items) {
    return {
      type: 'unchanged',
      isChanged: false,
      fromValue,
      toValue
    }
  }

  return {
    type: 'array',
    isChanged: true,
    fromValue,
    toValue,
    items
  }
}

function diffArrayByReinsert<A>(fromInput: ArrayInput<A>, toInput: ArrayInput<A>): ItemDiff<A>[] {
  const items: ItemDiff<A>[] = []

  for (let idx = 0; idx < toInput.length; idx++) {
    items.push({
      type: 'added',
      isChanged: true,
      fromIndex: undefined,
      fromValue: undefined,
      toIndex: idx,
      toValue: toInput.at(idx).value,
      hasMoved: false
    })
  }

  for (let idx = 0; idx < fromInput.length; idx++) {
    items.push({
      type: 'removed',
      isChanged: true,
      fromIndex: idx,
      fromValue: fromInput.at(idx).value,
      toIndex: undefined,
      toValue: undefined,
      hasMoved: false
    })
  }

  return items
}

/**
 * Diff an array when all the elements have _key in the same position.
 */
function diffArrayByKey<A>(
  fromKeyIndex: KeyIndex<A>,
  toKeyIndex: KeyIndex<A>
): ItemDiff<A>[] | undefined {
  const items: ItemDiff<A>[] = []
  let isChanged = false

  // TODO: use LCS to figure out which element which has moved

  for (let key of fromKeyIndex.keys) {
    let fromEntry = fromKeyIndex.index.get(key)!
    const fromValue = fromEntry.item.value

    let toEntry = toKeyIndex.index.get(key)

    if (toEntry) {
      const toValue = toEntry.item.value

      let diff = diffInput(fromEntry.item, toEntry.item)
      if (diff.isChanged) {
        items.push({
          type: 'changed',
          isChanged: true,
          fromIndex: fromEntry.index,
          fromValue,
          toValue,
          toIndex: toEntry.index,
          diff,
          hasMoved: false
        })
        isChanged = true
      } else {
        items.push({
          type: 'unchanged',
          isChanged: false,
          fromIndex: fromEntry.index,
          fromValue,
          toValue,
          toIndex: toEntry.index,
          hasMoved: false
        })
      }
    } else {
      items.push({
        type: 'removed',
        isChanged: true,
        fromIndex: fromEntry.index,
        fromValue,
        toValue: undefined,
        toIndex: undefined,
        hasMoved: false
      })
      isChanged = true
    }
  }

  for (let key of toKeyIndex.keys) {
    // Handled above
    if (fromKeyIndex.index.has(key)) continue

    let toEntry = toKeyIndex.index.get(key)!
    items.push({
      type: 'added',
      isChanged: true,
      fromIndex: undefined,
      fromValue: undefined,
      toValue: toEntry.item.value,
      toIndex: toEntry.index,
      hasMoved: false
    })
    isChanged = true
  }

  if (!isChanged) return

  items.sort(compareItemDiff)
  return items
}

function compareItemDiff<A>(a: ItemDiff<A>, b: ItemDiff<A>): number {
  if (a.toIndex !== undefined && b.toIndex !== undefined) {
    return b.toIndex - a.toIndex
  }

  if (a.fromIndex !== undefined && b.fromIndex !== undefined) {
    return b.fromIndex - a.fromIndex
  }

  if (a.fromIndex !== undefined && b.toIndex !== undefined) {
    // A was removed and B was added. Prefer to sort removals last.
    return -1
  }

  if (a.toIndex !== undefined && b.fromIndex !== undefined) {
    // A was added and B was removed. Prefer to sort removals last.
    return 1
  }

  throw new Error('invalid item diff comparison')
}

type KeyIndex<A> = {
  keys: (string | number)[]
  index: Map<string | number, ItemEntry<A>>
}

type ItemEntry<A> = {
  item: Input<A>
  index: number
}

/**
 * Indexes the array by a key. This handles cases where the items are:
 *
 * - Objects with _key
 * - Strings
 * - Numbers
 */
function indexByKey<A>(arr: ArrayInput<A>): KeyIndex<A> | undefined {
  let index = new Map<string | number, ItemEntry<A>>()
  let keys: (string | number)[] = []
  let length = arr.length

  for (let i = 0; i < length; i++) {
    let item = arr.at(i)

    let key: string | number | null = null

    if (item.type === 'string') {
      key = 's' + item.value
    } else if (item.type === 'number') {
      key = item.value
    } else if (item.type === 'object') {
      const keyField = item.get('_key')
      if (keyField && keyField.type === 'string') {
        key = 'k' + keyField.value
      }
    }

    // No key => abort
    if (key === null) return

    // We've already seen the same key => abort
    if (index.has(key)) return

    keys.push(key)
    index.set(key, {item, index: i})
  }

  // All is good.
  return {keys, index}
}
