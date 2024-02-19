import {
  applyPatches,
  cleanupSemantic,
  makeDiff,
  makePatches,
  type Patch,
} from '@sanity/diff-match-patch'
import {type RangeDecoration} from '@sanity/portable-text-editor'
import {
  isPortableTextSpan,
  isPortableTextTextBlock,
  type PortableTextBlock,
  type PortableTextTextBlock,
} from '@sanity/types'

import {isTextSelectionComment} from '../../helpers'
import {type CommentDocument, type CommentsTextSelectionItem} from '../../types'

function diffText(current: string, next: string) {
  const diff = makeDiff(current, next)
  const diffs = cleanupSemantic(diff)
  return makePatches(current, diffs)
}

function diffApply(current: string, patches: Patch[]) {
  let applied = current
  try {
    applied = applyPatches(patches, current, {allowExceedingIndices: true, deleteThreshold: 0.5})[0]
  } catch (err) {
    //
    console.error('Failed to apply patches', err)
  }
  return applied
}

// This symbol will represent the start of a new child when matching a text across spans
// We use the ASCII unit separator character (31) as it is a control character that is unlikely to be used in text.
const CHILD_SYMBOL = String.fromCharCode(31)
function toPlainTextWithChildSeparators(inputBlock: PortableTextTextBlock) {
  return inputBlock.children
    .map((child) => (isPortableTextSpan(child) ? child.text.replaceAll(CHILD_SYMBOL, ' ') : ''))
    .join(CHILD_SYMBOL)
}

const EMPTY_ARRAY: [] = []

export interface BuildCommentsRangeDecorationsProps {
  value: PortableTextBlock[] | undefined
  comments: CommentDocument[]
}

export interface BuildCommentsRangeDecorationsResultItem {
  selection: RangeDecoration['selection']
  comment: CommentDocument
  range: CommentsTextSelectionItem
}

/**
 * A function that builds range decoration selections from comments and their associated text.
 */
export function buildRangeDecorationSelectionsFromComments(
  props: BuildCommentsRangeDecorationsProps,
): BuildCommentsRangeDecorationsResultItem[] {
  const {value, comments} = props

  if (!value || value.length === 0) return EMPTY_ARRAY

  const textSelections = comments.filter(isTextSelectionComment)
  const decorators: BuildCommentsRangeDecorationsResultItem[] = []

  textSelections.forEach((comment) => {
    comment.target.path.selection?.value.forEach((selectionMember) => {
      const matchedBlock = value.find((block) => block._key === selectionMember._key)
      if (!matchedBlock || !isPortableTextTextBlock(matchedBlock)) {
        return
      }
      const selectionText = selectionMember.text.replaceAll(/(<([^>]+)>)/gi, '')
      const textWithChildSeparators = toPlainTextWithChildSeparators(matchedBlock)
      const patches = diffText(selectionText, selectionMember.text)
      const diffedText = diffApply(textWithChildSeparators, patches)
      const startIndex = diffedText.indexOf('<comment>')
      const endIndex = diffedText.replaceAll('<comment>', '').indexOf('</comment>')
      const textWithoutCommentTags = diffedText.replaceAll(/(<([^>]+)>)/gi, '')
      const commentedText = textWithoutCommentTags.substring(startIndex, endIndex)

      if (startIndex !== -1 && endIndex !== -1) {
        let childIndexAnchor = 0
        let anchorOffset = 0
        let childIndexFocus = 0
        let focusOffset = 0
        for (let i = 0; i < textWithoutCommentTags.length; i++) {
          if (diffedText[i] === CHILD_SYMBOL) {
            if (i <= startIndex) {
              anchorOffset = -1
              childIndexAnchor++
            }
            childIndexFocus++
            focusOffset = -1
          }
          if (i < startIndex) {
            anchorOffset++
          }
          if (i < startIndex + commentedText.length) {
            focusOffset++
          }
          if (i === startIndex + commentedText.length) {
            break
          }
        }
        decorators.push({
          selection: {
            anchor: {
              path: [
                {_key: matchedBlock._key},
                'children',
                {_key: matchedBlock.children[childIndexAnchor]._key},
              ],
              offset: anchorOffset,
            },
            focus: {
              path: [
                {_key: matchedBlock._key},
                'children',
                {_key: matchedBlock.children[childIndexFocus]._key},
              ],
              offset: focusOffset,
            },
          },
          comment,
          range: {_key: matchedBlock._key, text: diffedText},
        })
      }
    })
  })
  if (decorators.length === 0) return EMPTY_ARRAY
  return decorators
}

export interface BuildCommentRangeDecorationsProps {
  value: PortableTextBlock[] | undefined
  comment: CommentDocument
}

interface ValidateTextSelectionCommentProps {
  comment: CommentDocument
  value: PortableTextBlock[]
}

export function validateTextSelectionComment(props: ValidateTextSelectionCommentProps): boolean {
  const {comment, value} = props
  if (!isTextSelectionComment(comment)) return false

  const selections = buildRangeDecorationSelectionsFromComments({comments: [comment], value})

  return selections.length > 0
}
