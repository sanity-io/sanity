import {type EditorSelection, type EditorSelectionPoint} from '@portabletext/editor'
import {type CollaborationCommentRange} from '@sanity/client'
import {
  isKeySegment,
  isPortableTextSpan,
  isPortableTextTextBlock,
  type PortableTextBlock,
} from '@sanity/types'

/**
 * PTE selection offsets are relative to a span; the Comments API expects
 * an offset relative to the start of the block. This adds the text length
 * of preceding spans to bridge the two.
 */
function resolvePoint(
  point: EditorSelectionPoint,
  value: PortableTextBlock[],
): CollaborationCommentRange['start'] | null {
  const blockSegment = point.path[0]
  const spanSegment = point.path[point.path.length - 1]
  if (!isKeySegment(blockSegment) || !isKeySegment(spanSegment)) return null

  const block = value.find((candidate) => candidate._key === blockSegment._key)
  if (!isPortableTextTextBlock(block)) return null

  const spanIndex = block.children.findIndex((child) => child._key === spanSegment._key)
  if (spanIndex === -1) return null

  const offsetBeforeSpan = block.children
    .slice(0, spanIndex)
    .reduce((acc, child) => acc + (isPortableTextSpan(child) ? child.text.length : 0), 0)

  return {_key: block._key, offset: offsetBeforeSpan + point.offset}
}

/**
 * Converts a PTE selection into the range used by the Comments API.
 * Backward selections are normalized so `start` always precedes `end`.
 *
 * @internal
 */
export function selectionToRange(
  selection: NonNullable<EditorSelection>,
  value: PortableTextBlock[],
): CollaborationCommentRange | null {
  const normalized = selection.backward
    ? {anchor: selection.focus, focus: selection.anchor}
    : selection

  const start = resolvePoint(normalized.anchor, value)
  const end = resolvePoint(normalized.focus, value)
  if (!start || !end) return null

  return {start, end}
}

/**
 * Combines the per-block decorations of a comment into the single range the
 * Comments API stores. Returns `null` when no selection resolves, which
 * de-anchors the comment.
 *
 * @internal
 */
export function selectionsToRange(
  selections: Array<EditorSelection | null>,
  value: PortableTextBlock[],
): CollaborationCommentRange | null {
  const ranges = selections.flatMap((selection) => {
    if (selection === null) return []
    const range = selectionToRange(selection, value)
    return range ? [range] : []
  })

  if (ranges.length === 0) return null

  const blockOrder = new Map(value.map((block, index) => [block._key, index]))
  const comparePoints = (
    a: CollaborationCommentRange['start'],
    b: CollaborationCommentRange['start'],
  ): number => {
    const blockDifference = (blockOrder.get(a._key) ?? -1) - (blockOrder.get(b._key) ?? -1)
    return blockDifference || a.offset - b.offset
  }

  const starts = ranges.map((range) => range.start).sort(comparePoints)
  const ends = ranges.map((range) => range.end).sort(comparePoints)

  return {
    start: starts[0],
    end: ends[ends.length - 1],
  }
}
