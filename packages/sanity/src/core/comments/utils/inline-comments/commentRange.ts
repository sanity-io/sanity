import {type EditorSelection, type EditorSelectionPoint} from '@portabletext/editor'
import {
  isKeySegment,
  isPortableTextSpan,
  isPortableTextTextBlock,
  type KeyedSegment,
  type PortableTextBlock,
} from '@sanity/types'

import {type CommentRange, type CommentRangeEntry, type CommentRangePoint} from '../../types'

/**
 * Shallow equality check for two `CommentRange` values. Used to detect
 * whether a locally-persisted range has round-tripped from the server,
 * so the rebuild effect knows when it's safe to stop overriding with
 * the local decoration position.
 */
export function commentRangesEqual(
  a: CommentRange | undefined,
  b: CommentRange | undefined,
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.anchor.blockKey === b.anchor.blockKey &&
    a.anchor.offset === b.anchor.offset &&
    a.focus.blockKey === b.focus.blockKey &&
    a.focus.offset === b.focus.offset
  )
}

// ---------------------------------------------------------------------------
// Block-offset ↔ EditorSelection conversion
//
// Copied from @portabletext/editor (packages/editor/src/utils/), adapted to
// use `@sanity/types` guards instead of requiring an EditorContext + schema.
// ---------------------------------------------------------------------------

/**
 * Converts a `CommentRange` (block key + flat character offset) back to an
 * `EditorSelection` by finding the span that contains each offset.
 *
 * Based on `blockOffsetsToSelection` from @portabletext/editor.
 */
export function rangeToEditorSelection(
  range: CommentRange,
  value: PortableTextBlock[],
): EditorSelection {
  const anchor = blockOffsetToSpanSelectionPoint(range.anchor, value, 'forward')
  const focus = blockOffsetToSpanSelectionPoint(range.focus, value, 'backward')
  if (!anchor || !focus) {
    return null
  }

  return {anchor, focus}
}

/**
 * Converts an `EditorSelection` (with span-level paths) to a `CommentRange`
 * (block key + flat character offset).
 *
 * Based on `spanSelectionPointToBlockOffset` from @portabletext/editor.
 */
export function editorSelectionToRange(
  selection: EditorSelection,
  value: PortableTextBlock[],
): CommentRange | undefined {
  if (!selection) return undefined

  const anchorPoint = spanSelectionPointToBlockOffset(selection.anchor, value)
  const focusPoint = spanSelectionPointToBlockOffset(selection.focus, value)
  if (!anchorPoint || !focusPoint) return undefined

  return {anchor: anchorPoint, focus: focusPoint}
}

/**
 * Converts a flat block offset to a span-level `EditorSelectionPoint`.
 *
 * `direction` controls boundary behaviour: when the offset lands exactly at a
 * span boundary, `"forward"` places the caret at the start of the next span
 * while `"backward"` places it at the end of the previous one.
 *
 * Copied from `blockOffsetToSpanSelectionPoint` in @portabletext/editor.
 */
function blockOffsetToSpanSelectionPoint(
  point: CommentRangePoint,
  value: PortableTextBlock[],
  direction: 'forward' | 'backward',
): EditorSelectionPoint | undefined {
  let offsetLeft = point.offset
  let selectionPoint: {path: EditorSelectionPoint['path']; offset: number} | undefined
  let skippedInlineObject = false

  for (const block of value) {
    if (block._key !== point.blockKey) {
      continue
    }

    if (!isPortableTextTextBlock(block)) {
      continue
    }

    for (const child of block.children) {
      if (direction === 'forward') {
        if (!isPortableTextSpan(child)) {
          continue
        }

        if (offsetLeft <= child.text.length) {
          selectionPoint = {
            path: [{_key: point.blockKey}, 'children', {_key: child._key}],
            offset: offsetLeft,
          }
          break
        }

        offsetLeft -= child.text.length

        continue
      }

      if (!isPortableTextSpan(child)) {
        skippedInlineObject = true
        continue
      }

      if (offsetLeft === 0 && selectionPoint) {
        if (skippedInlineObject) {
          selectionPoint = {
            path: [{_key: point.blockKey}, 'children', {_key: child._key}],
            offset: 0,
          }
          skippedInlineObject = false
        }
        break
      }

      if (offsetLeft > child.text.length) {
        offsetLeft -= child.text.length
        continue
      }

      if (offsetLeft <= child.text.length) {
        selectionPoint = {
          path: [{_key: point.blockKey}, 'children', {_key: child._key}],
          offset: offsetLeft,
        }

        offsetLeft -= child.text.length

        if (offsetLeft !== 0) {
          break
        }
      }
    }
  }

  return selectionPoint
}

/**
 * Converts a span-level `EditorSelectionPoint` to a flat block offset.
 *
 * Copied from `spanSelectionPointToBlockOffset` in @portabletext/editor.
 */
function spanSelectionPointToBlockOffset(
  selectionPoint: EditorSelectionPoint,
  value: PortableTextBlock[],
): CommentRangePoint | undefined {
  let offset = 0

  const blockKey = isKeySegment(selectionPoint.path[0] as KeyedSegment)
    ? (selectionPoint.path[0] as KeyedSegment)._key
    : null
  const spanKey = isKeySegment(selectionPoint.path[2] as KeyedSegment)
    ? (selectionPoint.path[2] as KeyedSegment)._key
    : null

  if (!blockKey || !spanKey) {
    return undefined
  }

  for (const block of value) {
    if (block._key !== blockKey) {
      continue
    }

    if (!isPortableTextTextBlock(block)) {
      continue
    }

    for (const child of block.children) {
      if (child._key === spanKey) {
        return {
          blockKey: block._key,
          offset: offset + selectionPoint.offset,
        }
      }

      if (isPortableTextSpan(child)) {
        offset += child.text.length
      }
    }
  }

  return undefined
}

/**
 * Returns `true` when anchor and focus resolve to the same point,
 * meaning the selection covers zero characters.
 */
export function isZeroLengthSelection(selection: EditorSelection): boolean {
  if (!selection) return true
  const {anchor, focus} = selection
  if (anchor.offset !== focus.offset) return false

  const anchorBlockKey = (anchor.path[0] as KeyedSegment)?._key
  const focusBlockKey = (focus.path[0] as KeyedSegment)?._key
  if (anchorBlockKey !== focusBlockKey) return false

  const anchorSpanKey = (anchor.path[2] as KeyedSegment)?._key
  const focusSpanKey = (focus.path[2] as KeyedSegment)?._key
  return anchorSpanKey === focusSpanKey
}

/**
 * Normalises a `CommentRange` so that `anchor` is always the earlier
 * point in document order. PTE selections can be backwards (focus before
 * anchor) when the user selects right-to-left; the document ranges field
 * stores `start`/`end` and has no `backward` flag, so we need a canonical order.
 *
 * Requires the PTE `value` to determine block ordering.
 */
export function normalizeCommentRange(
  range: CommentRange,
  value: PortableTextBlock[],
): CommentRange {
  const {anchor, focus} = range

  if (anchor.blockKey === focus.blockKey) {
    if (anchor.offset <= focus.offset) return range
    return {anchor: focus, focus: anchor}
  }

  const anchorIdx = value.findIndex((b) => b._key === anchor.blockKey)
  const focusIdx = value.findIndex((b) => b._key === focus.blockKey)

  if (anchorIdx === -1 || focusIdx === -1) return range
  if (anchorIdx <= focusIdx) return range
  return {anchor: focus, focus: anchor}
}

const BLOCK_KEY_RE = /\[_key=='([^']+)'\]/

function extractBlockKey(path: string): string | null {
  const match = BLOCK_KEY_RE.exec(path)
  return match ? match[1] : null
}

/**
 * Converts a document-level `CommentRangeEntry` (start/end with path strings)
 * into an internal `CommentRange` (anchor/focus with blockKey + offset).
 * Returns `null` when the entry's paths are missing or unparseable.
 */
export function commentRangeEntryToRange(entry: CommentRangeEntry): CommentRange | null {
  if (!entry.start.path || !entry.end.path) return null
  const anchorKey = extractBlockKey(entry.start.path)
  const focusKey = extractBlockKey(entry.end.path)
  if (!anchorKey || !focusKey) return null
  return {
    anchor: {blockKey: anchorKey, offset: entry.start.position},
    focus: {blockKey: focusKey, offset: entry.end.position},
  }
}
