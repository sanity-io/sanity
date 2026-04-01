import {type RangeDecorationShift} from '@portabletext/editor'
import {type PortableTextBlock} from '@sanity/types'

import {COMMENT_RANGES_FIELD} from '../../../comments/constants'
import {
  editorSelectionToRange,
  normalizeCommentRange,
} from '../../../comments/utils/inline-comments/commentRange'
import {documentPatch, set, setIfMissing} from '../../patch'
import {type FormPatch} from '../../patch/types'

/**
 * Converts an array of `RangeDecorationShift`s (from the PTE editor's
 * mutation event) into form patches that update the comment-ranges field
 * ({@link COMMENT_RANGES_FIELD}) on the document root.
 *
 * Only **local** shifts are processed — remote shifts are already accounted
 * for by the remote user's transaction.
 *
 * Each returned patch is wrapped with `documentPatch()` so it bypasses
 * the form tree's `prefixPath` and arrives at `patch.execute` with its
 * absolute path targeting the ranges field.
 *
 * @internal
 */
export function shiftsToSystemRangePatches(
  shifts: RangeDecorationShift[] | undefined,
  value: PortableTextBlock[] | undefined,
): FormPatch[] {
  if (!shifts || shifts.length === 0 || !value) return []

  const patches: FormPatch[] = []

  for (const shift of shifts) {
    if (shift.origin !== 'local') continue

    const commentId = shift.rangeDecoration.payload?.commentId as string | undefined
    if (!commentId) continue

    if (!shift.newSelection) continue

    const raw = editorSelectionToRange(shift.newSelection, value)
    if (!raw) continue

    const range = normalizeCommentRange(raw, value)

    patches.push(documentPatch(setIfMissing([], [COMMENT_RANGES_FIELD])))
    patches.push(
      documentPatch(
        set({path: `[_key=='${range.anchor.blockKey}']`, position: range.anchor.offset}, [
          COMMENT_RANGES_FIELD,
          {_key: commentId},
          'start',
        ]),
      ),
    )
    patches.push(
      documentPatch(
        set({path: `[_key=='${range.focus.blockKey}']`, position: range.focus.offset}, [
          COMMENT_RANGES_FIELD,
          {_key: commentId},
          'end',
        ]),
      ),
    )
  }

  return patches
}
