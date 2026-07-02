import {type RangeDecoration} from '@portabletext/editor'
import {
  applyPatches,
  cleanupEfficiency,
  type Diff,
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  makeDiff,
  makePatches,
  type Patch,
} from '@sanity/diff-match-patch'
import {
  isPortableTextSpan,
  isPortableTextTextBlock,
  type Path,
  type PortableTextBlock,
  type PortableTextTextBlock,
} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'

import {getValueAtPath} from '../../../field'
import {isTextSelectionComment} from '../../helpers'
import {type CommentDocument, type CommentsTextSelectionItem} from '../../types'

// This must be set high to avoid false positives
// (for example, when there are multiple occurrences of the same word, and you delete the original commented word)
// Don't set it above 15, as it will cause performance issues
const DMP_MARGIN = 15

function diffText(current: string, next: string) {
  const diff = makeDiff(current, next)
  const diffs = cleanupEfficiency(diff)
  const levenshtein = diffsLevenshtein(diffs)
  return {patches: makePatches(current, diffs, {margin: DMP_MARGIN}), levenshtein}
}

function diffApply(current: string, patches: Patch[]) {
  return applyPatches(patches, current, {
    allowExceedingIndices: true,
    margin: DMP_MARGIN,
  })[0]
}

const CHILD_SYMBOL = '\uF0D0'
function toPlainTextWithChildSeparators(inputBlock: PortableTextTextBlock) {
  return inputBlock.children
    .map((child) => (isPortableTextSpan(child) ? child.text.replaceAll(CHILD_SYMBOL, ' ') : ''))
    .join(CHILD_SYMBOL)
}

export const COMMENT_INDICATORS = ['\uF000', '\uF001']
const COMMENT_INDICATORS_REGEX = new RegExp(`[${COMMENT_INDICATORS.join('')}]`, 'g')

const EMPTY_ARRAY: [] = []

/**
 * @internal
 */
export interface BuildCommentsRangeDecorationsProps {
  value: PortableTextBlock[] | undefined
  comments: CommentDocument[]
  /**
   * Document value used together with `basePath` to resolve each comment's
   * stored `field` as a data path. Comments live at the document level, so
   * container-nested blocks resolve through the same walk as top-level ones.
   * When absent, falls back to a flat top-level `value.find(...)` — the shape
   * existing unit tests exercise.
   */
  documentValue?: unknown
  /**
   * The editor's own document path. Used together with `documentValue` to
   * strip the document-level prefix from each comment's `field` before
   * descending into the editor value, and to prefix the emitted decoration
   * selection paths so they address from the editor root.
   */
  basePath?: Path
}

/**
 * @internal
 */
export interface BuildCommentsRangeDecorationsResultItem {
  selection: RangeDecoration['selection']
  comment: CommentDocument
  range: CommentsTextSelectionItem
}

/**
 * A function that builds range decoration selections from comments and their associated text.
 * @internal
 */
export function buildRangeDecorationSelectionsFromComments(
  props: BuildCommentsRangeDecorationsProps,
): BuildCommentsRangeDecorationsResultItem[] {
  const {value, comments, documentValue, basePath} = props

  if (!value || value.length === 0) return EMPTY_ARRAY

  const textSelections = comments.filter(isTextSelectionComment)
  const decorators: BuildCommentsRangeDecorationsResultItem[] = []

  textSelections.forEach((comment) => {
    const field = comment.target.path?.field ?? ''

    // Compute the editor-relative prefix from the stored data path. Without a
    // documentValue + basePath, the comment is assumed to point at a top-level
    // block, matching today's behavior and the existing unit-test fixtures.
    let relative: Path = []
    if (documentValue !== undefined && basePath) {
      const fieldPath = PathUtils.fromString(field)
      if (!PathUtils.startsWith(basePath, fieldPath)) return
      relative = fieldPath.slice(basePath.length)
    }

    comment.target.path?.selection?.value.forEach((selectionMember) => {
      const matchedBlock =
        documentValue !== undefined && basePath
          ? (getValueAtPath(documentValue, [
              ...basePath,
              ...relative,
              {_key: selectionMember._key},
            ]) as PortableTextBlock | undefined)
          : value.find((block) => block._key === selectionMember._key)
      if (!matchedBlock || !isPortableTextTextBlock(matchedBlock)) {
        return
      }
      const selectionText = selectionMember.text.replaceAll(COMMENT_INDICATORS_REGEX, '')
      const textWithChildSeparators = toPlainTextWithChildSeparators(matchedBlock)
      const {patches} = diffText(selectionText, selectionMember.text)
      const diffedText = diffApply(textWithChildSeparators, patches)
      const startIndex = diffedText.indexOf(COMMENT_INDICATORS[0])
      const endIndex = diffedText
        .replaceAll(COMMENT_INDICATORS[0], '')
        .indexOf(COMMENT_INDICATORS[1])
      const textWithoutCommentTags = diffedText.replaceAll(COMMENT_INDICATORS_REGEX, '')
      const oldCommentedText = selectionMember.text.slice(
        selectionMember.text.indexOf(COMMENT_INDICATORS[0]) + 1,
        selectionMember.text.indexOf(COMMENT_INDICATORS[1]),
      )
      const newCommentedText = textWithoutCommentTags.slice(startIndex, endIndex)
      const {levenshtein} = diffText(newCommentedText, oldCommentedText)
      const threshold = Math.round(newCommentedText.length + oldCommentedText.length / 2)

      let nullSelection = false

      if (newCommentedText.length === 0) {
        nullSelection = true
      }

      if (levenshtein > threshold) {
        nullSelection = true
      }

      // If there no longer is any text within the range, we don't need to create a decoration
      if (startIndex + 1 === endIndex) {
        nullSelection = true
      }

      if (startIndex !== -1 && endIndex !== -1) {
        let childIndexAnchor = 0
        let anchorOffset = 0
        let childIndexFocus = 0
        let focusOffset = 0
        for (let i = 0; i < textWithoutCommentTags.length; i++) {
          if (textWithoutCommentTags[i] === CHILD_SYMBOL) {
            if (i <= startIndex) {
              anchorOffset = -1
              childIndexAnchor++
            }
            focusOffset = -1
            childIndexFocus++
          }
          if (i < startIndex) {
            anchorOffset++
          }
          if (i < startIndex + newCommentedText.length) {
            focusOffset++
          }
          if (i === startIndex + newCommentedText.length) {
            break
          }
        }

        decorators.push({
          selection: {
            anchor: {
              path: [
                ...relative,
                {_key: matchedBlock._key},
                'children',
                {_key: matchedBlock.children[childIndexAnchor]._key},
              ],
              offset: anchorOffset,
            },
            focus: {
              path: [
                ...relative,
                {_key: matchedBlock._key},
                'children',
                {_key: matchedBlock.children[childIndexFocus]._key},
              ],
              offset: focusOffset,
            },
          },
          comment,
          range: {_key: matchedBlock._key, text: nullSelection ? '' : diffedText},
        })
      }
    })
  })
  if (decorators.length === 0) return EMPTY_ARRAY
  return decorators
}

interface ValidateTextSelectionCommentProps {
  comment: CommentDocument
  value: PortableTextBlock[]
}

function validateTextSelectionComment(props: ValidateTextSelectionCommentProps): boolean {
  const {comment, value} = props
  if (!isTextSelectionComment(comment)) return false

  const selections = buildRangeDecorationSelectionsFromComments({comments: [comment], value})

  return selections.length > 0
}

function diffsLevenshtein(diffs: Diff[]): number {
  let levenshtein = 0
  let insertions = 0
  let deletions = 0
  for (let x = 0; x < diffs.length; x++) {
    const op = diffs[x][0]
    const data = diffs[x][1]
    switch (op) {
      case DIFF_INSERT:
        insertions += data.length
        break
      case DIFF_DELETE:
        deletions += data.length
        break
      case DIFF_EQUAL:
        // A deletion and an insertion is one substitution.
        levenshtein += Math.max(insertions, deletions)
        insertions = 0
        deletions = 0
        break
      default:
      // Do nothing
    }
  }
  levenshtein += Math.max(insertions, deletions)
  return levenshtein
}
