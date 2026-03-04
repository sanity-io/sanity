import {isPortableTextTextBlock} from '@sanity/types'

import {isRecord} from '../../util/isRecord'
import {randomKey} from './randomKey'

const KEY_LENGTH = 12

/**
 * Regenerates every `_key` in an array item and its nested value tree.
 * For Portable Text blocks, remaps `children[].marks` to match new `markDefs` keys.
 */
export function regenerateKeys<T extends {_key: string}>(item: T): T {
  return regenerateValue(item) as T
}

function buildMarkKeyMap(markDefs: unknown): Map<string, string> | undefined {
  if (!Array.isArray(markDefs) || markDefs.length === 0) return undefined

  const entries = markDefs.flatMap<[string, string]>((entry) =>
    isRecord(entry) && typeof entry._key === 'string' ? [[entry._key, randomKey(KEY_LENGTH)]] : [],
  )

  return entries.length > 0 ? new Map(entries) : undefined
}

function remapMarks(child: unknown, markKeyMap: Map<string, string>): unknown {
  if (isRecord(child) && Array.isArray(child.marks)) {
    return {
      ...child,
      marks: child.marks.map((mark) =>
        typeof mark === 'string' ? (markKeyMap.get(mark) ?? mark) : mark,
      ),
    }
  }
  return child
}

function regenerateValue(value: unknown, markDefKeyMap?: Map<string, string>): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => regenerateValue(entry, markDefKeyMap))
  }
  if (!isRecord(value)) return value

  const blockMarkKeyMap = isPortableTextTextBlock(value)
    ? buildMarkKeyMap(value.markDefs)
    : undefined

  return Object.fromEntries(
    Object.entries(value).map(([field, fieldValue]) => {
      if (field === '_key') {
        const remappedKey = markDefKeyMap?.get(fieldValue as string)
        return [field, remappedKey ?? randomKey(KEY_LENGTH)]
      }
      if (field === 'markDefs' && blockMarkKeyMap) {
        return [
          field,
          (fieldValue as Array<unknown>).map((entry) => regenerateValue(entry, blockMarkKeyMap)),
        ]
      }
      if (field === 'children' && blockMarkKeyMap) {
        const regeneratedChildren = (fieldValue as Array<unknown>).map((child) =>
          regenerateValue(child),
        )
        return [field, regeneratedChildren.map((child) => remapMarks(child, blockMarkKeyMap))]
      }
      return [field, regenerateValue(fieldValue)]
    }),
  )
}
