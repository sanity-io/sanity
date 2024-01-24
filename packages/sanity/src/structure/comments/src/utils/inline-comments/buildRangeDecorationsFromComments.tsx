import {RangeDecoration, EditorSelection} from '@sanity/portable-text-editor'
import {isPortableTextTextBlock, isPortableTextSpan, PortableTextTextBlock} from '@sanity/types'
import {fuzzy} from 'fast-fuzzy'
import {flatten} from 'lodash'
import {PropsWithChildren} from 'react'
import {
  cleanupEfficiency,
  makeDiff,
  DIFF_EQUAL,
  DIFF_DELETE,
  DIFF_INSERT,
} from '@sanity/diff-match-patch'
import {CommentMessage, CommentThreadItem} from '../../types'

const CHILD_SYMBOL = '\uF0D0'
const EMPTY_ARRAY: [] = []
const FALLBACK_TO_BLOCK = true

function CommentDecorator(props: PropsWithChildren<{commentId: string}>) {
  const {children, commentId} = props
  return (
    <span
      data-inline-comment-state="added"
      data-inline-comment-id={commentId}
      style={{backgroundColor: '#ffcc00', color: '#000'}}
    >
      {children}
    </span>
  )
}

function buildSegments(fromInput: string, toInput: string): any[] {
  const segments: unknown[] = []
  const dmpDiffs = cleanupEfficiency(makeDiff(fromInput, toInput))

  let fromIdx = 0
  let toIdx = 0

  for (const [op, text] of dmpDiffs) {
    switch (op) {
      case DIFF_EQUAL:
        segments.push({
          type: 'stringSegment',
          action: 'unchanged',
          text,
        })
        fromIdx += text.length
        toIdx += text.length
        break
      case DIFF_DELETE:
        segments.push({
          type: 'stringSegment',
          action: 'removed',
          text: fromInput.substring(fromIdx, fromIdx + text.length),
          annotation: null,
        })
        fromIdx += text.length
        break
      case DIFF_INSERT:
        segments.push({
          type: 'stringSegment',
          action: 'added',
          text: toInput.substring(toIdx, toIdx + text.length),
          annotation: null,
        })
        toIdx += text.length
        break
      default:
      // Do nothing
    }
  }

  return flatten(segments)
}

function toPlainTextWithChildSeparators(inputBlock: PortableTextTextBlock) {
  return inputBlock.children.map((child) => child.text).join(CHILD_SYMBOL)
}

export interface BuildCommentsRangeDecorationsProps {
  value: CommentMessage
  comments: CommentThreadItem[]
}

/**
 * A function that builds range decorations from comments and the comment message value
 */
export function buildRangeDecorationsFromComments(
  props: BuildCommentsRangeDecorationsProps,
): RangeDecoration[] {
  const {value, comments} = props

  if (!value || value.length === 0) return EMPTY_ARRAY

  const textSelections = comments.filter(
    (comment) => comment.selection?.type === 'text' && comment.selection.value,
  )

  const decorators = textSelections.map((comment) => {
    const decoratorRanges = comment.selection?.value.map((range) => {
      const matchedBlock = value.find((block) => block._key === range._key)

      if (!matchedBlock || !isPortableTextTextBlock(matchedBlock)) {
        return EMPTY_ARRAY
      }

      const positions: EditorSelection[] = []
      let isMatched = false

      if (typeof range.text === 'string') {
        const text = toPlainTextWithChildSeparators(matchedBlock)
        const matchData = fuzzy(range.text, text, {returnMatchData: true})
        const matchPosition = matchData.match.index

        const childIndicatorRegex = new RegExp(
          CHILD_SYMBOL.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'),
          'g',
        )

        if (matchPosition > -1 && matchData.score > 0.8) {
          isMatched = true

          const segments = buildSegments(text, range.text)
          let childIndex = 0

          // eslint-disable-next-line max-nested-callbacks
          segments.forEach((segment) => {
            if (segment.action === 'removed') {
              const childIndicatorMatches = segment.text.match(childIndicatorRegex)
              childIndex += childIndicatorMatches ? childIndicatorMatches.length : 0
            }
            if (segment.action === 'unchanged') {
              const childIndicatorMatches = segment.text.match(childIndicatorRegex)
              childIndex += childIndicatorMatches ? childIndicatorMatches.length : 0
            }
          })

          const decorationSelection: RangeDecoration['selection'] = {
            anchor: {
              path: [
                {_key: matchedBlock._key},
                'children',
                {_key: matchedBlock.children[childIndex]._key},
              ],
              offset:
                matchPosition -
                matchedBlock.children
                  .slice(0, childIndex)
                  .map((child) => (isPortableTextSpan(child) ? child.text.length : 0))
                  .reduce((a, b) => a + b, 0) -
                childIndex,
            },
            focus: {
              path: [
                {_key: matchedBlock._key},
                'children',
                {_key: matchedBlock.children[childIndex]._key},
              ],
              offset:
                matchPosition -
                matchedBlock.children
                  .slice(0, childIndex)
                  .map((child) => (isPortableTextSpan(child) ? child.text.length : 0))
                  .reduce((a, b) => a + b, 0) -
                childIndex +
                range.text.length,
            },
          }

          positions.push(decorationSelection)

          return positions
        }
      }

      if ((!isMatched && FALLBACK_TO_BLOCK) || !range.text) {
        let endOffset = 0
        const lastChild = matchedBlock.children[matchedBlock.children.length - 1]

        if (isPortableTextSpan(lastChild)) {
          endOffset = lastChild.text.length
        }

        const decorationSelection: RangeDecoration['selection'] = {
          anchor: {
            path: [{_key: matchedBlock._key}, 'children', {_key: matchedBlock.children[0]._key}],
            offset: 0,
          },
          focus: {
            path: [
              {_key: matchedBlock._key},
              'children',
              {_key: matchedBlock.children[matchedBlock.children.length - 1]._key},
            ],
            offset: endOffset,
          },
        }

        positions.push(decorationSelection)

        return positions
      }

      return EMPTY_ARRAY
    })

    return flatten(decoratorRanges).map((range) => {
      const rangeDecoration: RangeDecoration = {
        component: ({children}) => (
          <CommentDecorator commentId={comment.parentComment._id}>{children}</CommentDecorator>
        ),
        isRangeInvalid: () => false,
        selection: range,
      }

      return rangeDecoration
    })
  })

  return flatten(decorators)
}
