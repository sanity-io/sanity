import {isRecord} from '../../util/isRecord'
import {randomKey} from './randomKey'

const KEY_LENGTH = 12

/**
 * Regenerates every `_key` in an array item and its nested value tree.
 * For PT blocks, remaps `children[].marks` to match new `markDefs` keys.
 */
export function regenerateKeys<T extends {_key: string}>(item: T): T {
  return regenerate(item) as T
}

function buildMarkKeyMap(markDefs: unknown): Map<string, string> | undefined {
  if (
    Array.isArray(markDefs) &&
    markDefs.length > 0 &&
    markDefs.every((entry) => isRecord(entry) && typeof entry._key === 'string')
  ) {
    return new Map(markDefs.map((def) => [def._key, randomKey(KEY_LENGTH)]))
  }
  return undefined
}

function regenerate(val: unknown): unknown {
  if (Array.isArray(val)) return val.map(regenerate)
  if (!isRecord(val)) return val

  const keyMap = val._type === 'block' ? buildMarkKeyMap(val.markDefs) : undefined

  const result = Object.fromEntries(
    Object.entries(val).map(([key, value]) => [
      key,
      key === '_key' ? randomKey(KEY_LENGTH) : regenerate(value),
    ]),
  ) as Record<string, unknown>

  if (!keyMap) return result

  const originalDefs = val.markDefs as Array<{_key: string}>

  return {
    ...result,
    markDefs: Array.isArray(result.markDefs)
      ? (result.markDefs as Array<Record<string, unknown>>).map((def, index) => ({
          ...def,
          _key: keyMap.get(originalDefs[index]._key)!,
        }))
      : result.markDefs,
    children: Array.isArray(result.children)
      ? (result.children as Array<unknown>).map((child) => {
          if (isRecord(child) && Array.isArray(child.marks)) {
            return {
              ...child,
              marks: (child.marks as Array<unknown>).map((mark) =>
                typeof mark === 'string' ? (keyMap.get(mark) ?? mark) : mark,
              ),
            }
          }
          return child
        })
      : result.children,
  }
}
