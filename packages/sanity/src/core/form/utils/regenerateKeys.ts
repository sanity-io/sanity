import {randomKey} from './randomKey'

const KEY_LENGTH = 12

/**
 * Regenerates every `_key` in an array item and its nested value tree.
 * Remaps `children[].marks` to match new `markDefs` keys so PT annotations survive.
 * Unchanged branches return original references.
 */
export function regenerateKeys<T extends {_key: string}>(item: T): T {
  return regenerateKeysInObject(item) as T
}

type Obj = Record<string, unknown>

function isKeyedObject(val: unknown): val is Obj & {_key: string} {
  return typeof val === 'object' && val !== null && typeof (val as Obj)._key === 'string'
}

function isMarkDefsArray(val: unknown): val is Array<Obj & {_key: string}> {
  return Array.isArray(val) && val.length > 0 && val.every(isKeyedObject)
}

/**
 * Walks object properties, regenerating keys in nested arrays.
 * For PT blocks, remaps `children[].marks` to match new `markDefs` keys.
 */
function regenerateKeysInObject(obj: Obj): Obj {
  const markDefs = obj.markDefs
  const hasMarkDefs = isMarkDefsArray(markDefs)

  const markKeyMap = hasMarkDefs
    ? new Map(markDefs.map((def) => [def._key, randomKey(KEY_LENGTH)]))
    : undefined

  let changed = false
  const result: Obj = {}

  for (const key of Object.keys(obj)) {
    const val = obj[key]
    let next: unknown

    if (key === '_key') {
      next = randomKey(KEY_LENGTH)
      changed = true
    } else if (hasMarkDefs && key === 'markDefs') {
      next = processMarkDefs(markDefs, markKeyMap!)
      changed = true
    } else if (hasMarkDefs && key === 'children' && Array.isArray(val)) {
      next = processChildren(val, markKeyMap!)
      changed = true
    } else {
      next = regenerateKeysInValue(val)
      if (next !== val) changed = true
    }

    result[key] = next
  }

  return changed ? result : obj
}

/** Applies pre-computed keys to markDefs items and recurses into each def's properties. */
function processMarkDefs(
  defs: Array<Obj & {_key: string}>,
  keyMap: Map<string, string>,
): Array<Obj> {
  return defs.map((def) => {
    const processed = regenerateKeysInObject(def)
    return {...processed, _key: keyMap.get(def._key)!}
  })
}

/** Regenerates keys in PT block children and remaps `marks` strings to match new markDefs keys. */
function processChildren(children: Array<unknown>, keyMap: Map<string, string>): Array<unknown> {
  return children.map((child) => {
    if (typeof child !== 'object' || child === null) return child
    const obj = child as Obj
    const processed = isKeyedObject(obj) ? regenerateKeysInObject(obj) : obj
    const marks = processed.marks

    if (Array.isArray(marks)) {
      const remappedMarks = remapMarks(marks, keyMap)
      if (remappedMarks !== marks || processed !== obj) {
        return {...processed, marks: remappedMarks}
      }
    }

    return processed
  })
}

function remapMarks(marks: Array<unknown>, keyMap: Map<string, string>): Array<unknown> {
  let changed = false
  const result = marks.map((mark) => {
    if (typeof mark === 'string' && keyMap.has(mark)) {
      changed = true
      return keyMap.get(mark)!
    }
    return mark
  })
  return changed ? result : marks
}

/**
 * Descends into arrays of keyed objects; all other values returned as-is.
 */
function regenerateKeysInValue(val: unknown): unknown {
  if (typeof val !== 'object' || val === null) return val

  if (Array.isArray(val)) {
    let changed = false
    const next = val.map((item) => {
      if (isKeyedObject(item)) {
        const processed = regenerateKeysInObject(item)
        if (processed !== item) changed = true
        return processed
      }
      if (typeof item === 'object' && item !== null) {
        const processed = regenerateKeysInValue(item)
        if (processed !== item) changed = true
        return processed
      }
      return item
    })
    return changed ? next : val
  }

  return regenerateKeysInObject(val as Obj)
}
