import {isPortableTextTextBlock} from '@sanity/types'

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

function regenerate(val: unknown, skipKeyForMarkDefs?: Map<string, string>): unknown {
  if (Array.isArray(val)) return val.map((entry) => regenerate(entry, skipKeyForMarkDefs))
  if (!isRecord(val)) return val

  const keyMap = isPortableTextTextBlock(val) ? buildMarkKeyMap(val.markDefs) : undefined

  const result = Object.fromEntries(
    Object.entries(val).map(([key, value]) => {
      if (key === '_key') {
        const mapped = skipKeyForMarkDefs?.get(value as string)
        return [key, mapped ?? randomKey(KEY_LENGTH)]
      }
      if (key === 'markDefs' && keyMap) {
        return [key, (value as Array<unknown>).map((entry) => regenerate(entry, keyMap))]
      }
      return [key, regenerate(value)]
    }),
  ) as Record<string, unknown>

  if (!keyMap) return result

  return {
    ...result,
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
