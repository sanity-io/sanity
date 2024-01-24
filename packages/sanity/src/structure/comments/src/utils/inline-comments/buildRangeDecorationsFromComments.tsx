/* eslint-disable max-depth */
import {RangeDecoration, EditorSelection} from '@sanity/portable-text-editor'
import {isPortableTextTextBlock, isPortableTextSpan, PortableTextTextBlock} from '@sanity/types'
import {fuzzy} from 'fast-fuzzy'
import {flatten} from 'lodash'
import {PropsWithChildren} from 'react'
import {CommentMessage, CommentThreadItem} from '../../types'

// const CHILD_SYMBOL = '\uF0D0'
const CHILD_SYMBOL = '|'
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
      const isMatched = false

      if (typeof range.text === 'string') {
        const text = toPlainTextWithChildSeparators(matchedBlock)
        const matchData = fuzzy(range.text, text, {returnMatchData: true})
        const matchPosition = matchData.match.index
        // console.log(JSON.stringify(matchData, null, 2))

        if (matchPosition > -1 && matchData.score > 0.8) {
          let childIndexAnchor = 0
          let anchorOffset = 0
          let childIndexFocus = 0
          let focusOffset = 0
          for (let i = 0; i < matchData.original.length; i++) {
            if (matchData.original[i] === CHILD_SYMBOL) {
              if (i <= matchData.match.index) {
                anchorOffset = -1
                childIndexAnchor++
              }
              childIndexFocus++
              focusOffset = -1
            }
            if (i < matchData.match.index) {
              anchorOffset++
            }
            if (i < matchData.match.index + matchData.match.length) {
              focusOffset++
            }
            if (i === matchData.match.index + matchData.match.length) {
              break
            }
          }

          const decorationSelection: RangeDecoration['selection'] = {
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
