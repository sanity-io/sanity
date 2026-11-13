import {isRecord} from '../../../util/isRecord'

/** @internal */
export interface DiscardedText {
  /** The top-level field the text belongs to */
  field: string
  text: string
}

function isSystemKey(key: string): boolean {
  return key.startsWith('_')
}

function textBlockText(value: unknown): string | undefined {
  if (isRecord(value) && Array.isArray(value.children)) {
    return value.children
      .map((child) => (isRecord(child) && typeof child.text === 'string' ? child.text : ''))
      .join('')
  }
  return undefined
}

function findRestoredItem(restored: unknown, item: unknown, index: number): unknown {
  const restoredItems: unknown[] = Array.isArray(restored) ? restored : []
  const key = isRecord(item) ? item._key : undefined
  return typeof key === 'string'
    ? restoredItems.find((candidate) => isRecord(candidate) && candidate._key === key)
    : restoredItems[index]
}

function changedText(discarded: unknown, restored: unknown): string[] {
  const blockText = textBlockText(discarded)
  if (typeof blockText === 'string') {
    return blockText === textBlockText(restored) || blockText === '' ? [] : [blockText]
  }
  if (typeof discarded === 'string') {
    return discarded === restored || discarded === '' ? [] : [discarded]
  }
  if (Array.isArray(discarded)) {
    return discarded.flatMap((item, index) =>
      changedText(item, findRestoredItem(restored, item, index)),
    )
  }
  if (isRecord(discarded)) {
    const restoredFields = isRecord(restored) ? restored : {}
    return Object.entries(discarded).flatMap(([key, value]) =>
      isSystemKey(key) ? [] : changedText(value, restoredFields[key]),
    )
  }
  return []
}

/**
 * The text in `discarded` that `restored` does not hold at the same place, so a user can copy out
 * what a rejected save dropped. Array items are matched by `_key` where they have one, and a
 * Portable Text block counts as one piece of text.
 *
 * @internal
 */
export function getDiscardedText(discarded: unknown, restored: unknown): DiscardedText[] {
  const restoredFields = isRecord(restored) ? restored : {}
  return Object.entries(isRecord(discarded) ? discarded : {}).flatMap(([field, value]) =>
    isSystemKey(field)
      ? []
      : changedText(value, restoredFields[field]).map((text) => ({field, text})),
  )
}
