import {
  isPortableTextTextBlock,
  type PortableTextBlock,
  type PortableTextTextBlock,
} from '@sanity/types'

type KeyedPathSegment = {_key: string}
export type AncestorPath = Array<KeyedPathSegment | string>

/**
 * Recursively walk `value` and any array-valued fields on its items
 * (e.g. container fields like `list.items`, `listItem.content`) to
 * find a text block by `_key`. Returns the block plus the full keyed
 * path from the root, suitable as a `RangeDecoration` selection path.
 *
 * Needed because container API v2 allows text blocks to live inside
 * containers, not only at the root. The previous root-level `find`
 * would fail to locate nested blocks and cause comments to appear
 * unlinked.
 *
 * @internal
 */
export function findTextBlockByKey(
  value: PortableTextBlock[],
  blockKey: string,
): {block: PortableTextTextBlock; ancestorPath: AncestorPath} | undefined {
  function visit(
    items: unknown[],
    pathPrefix: AncestorPath,
  ): {block: PortableTextTextBlock; ancestorPath: AncestorPath} | undefined {
    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      const node = item as {_key?: string; [field: string]: unknown}
      const key = node._key
      if (typeof key !== 'string') continue
      const here: AncestorPath = [...pathPrefix, {_key: key}]
      if (key === blockKey && isPortableTextTextBlock(item)) {
        return {block: item, ancestorPath: here}
      }
      for (const fieldName of Object.keys(node)) {
        if (fieldName === '_key' || fieldName === '_type') continue
        const fieldValue = node[fieldName]
        if (!Array.isArray(fieldValue)) continue
        const found = visit(fieldValue, [...here, fieldName])
        if (found) return found
      }
    }
    return undefined
  }
  return visit(value, [])
}

/**
 * Given a path's segments, return the `_key` of the enclosing text
 * block — the keyed segment immediately before the `'children'` string
 * segment. Returns `undefined` if no such segment exists (path not
 * inside a text block's children).
 *
 * @internal
 */
export function getEnclosingTextBlockKey(path: ReadonlyArray<unknown>): string | undefined {
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i] === 'children' && i > 0) {
      const seg = path[i - 1]
      if (isKeySegment(seg)) return seg._key
    }
  }
  return undefined
}

function isKeySegment(seg: unknown): seg is KeyedPathSegment {
  return (
    typeof seg === 'object' &&
    seg !== null &&
    '_key' in seg &&
    typeof (seg as KeyedPathSegment)._key === 'string'
  )
}
