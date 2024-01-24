/* eslint-disable max-depth */
import {RangeDecoration} from '@sanity/portable-text-editor'
import {isPortableTextTextBlock, isPortableTextSpan, PortableTextTextBlock} from '@sanity/types'
import {fuzzy} from 'fast-fuzzy'
import {flatten} from 'lodash'
import {CommentMessage, CommentThreadItem} from '../../types'

// This symbol will represent the start of a new child when doing fuzzy matching
// of text across block children.
// Ideally this should be an unused unicode or ASCII character that will not occur
// in a document's text, but to play well with the fuzzy matching library it
// needs to be a character that can be ignored by the library (`~!@#$%^&*()-=_+{}[]\|\;':",./<>?)
// We will replace this character with a space in the content when we process it
// for fuzzy matching.
const CHILD_SYMBOL = '~'
function toPlainTextWithChildSeparators(inputBlock: PortableTextTextBlock) {
  return inputBlock.children
    .map((child) => (isPortableTextSpan(child) ? child.text.replaceAll(CHILD_SYMBOL, ' ') : ''))
    .join(CHILD_SYMBOL)
}

// The fuzzy matching library will return a match if the score is above this threshold (0-1 where 1 is exact match)
const FUZZY_MATCH_SCORE_THRESHOLD = 0.75

const EMPTY_ARRAY: [] = []

export interface BuildCommentsRangeDecorationsProps {
  value: CommentMessage
  comments: CommentThreadItem[]
}

/**
 * A function that builds range decoration selections from comments and their associated text.
 */
export function buildRangeDecorationSelectionsFromComments(
  props: BuildCommentsRangeDecorationsProps,
): {selection: RangeDecoration['selection']; comment: CommentThreadItem}[] {
  const {value, comments} = props

  if (!value || value.length === 0) return EMPTY_ARRAY

  const textSelections = comments.filter(
    (comment) => comment.selection?.type === 'text' && comment.selection.value,
  )

  return flatten(
    textSelections.map((comment) => {
      return flatten(
        comment.selection?.value.map((selectionMember) => {
          const matchedBlock = value.find((block) => block._key === selectionMember._key)
          if (!matchedBlock || !isPortableTextTextBlock(matchedBlock)) {
            return EMPTY_ARRAY
          }
          if (typeof selectionMember.text === 'string') {
            const text = toPlainTextWithChildSeparators(matchedBlock)
            const matchData = fuzzy(selectionMember.text, text, {
              ignoreCase: false,
              ignoreSymbols: true,
              normalizeWhitespace: true,
              returnMatchData: true,
              useDamerau: selectionMember.text.length > 10,
              useSeparatedUnicode: true,
            })
            if (matchData.score > FUZZY_MATCH_SCORE_THRESHOLD) {
              let childIndexAnchor = 0
              let anchorOffset = 0
              let childIndexFocus = 0
              let focusOffset = 0
              for (let i = 0; i < text.length; i++) {
                if (text[i] === CHILD_SYMBOL) {
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
              return [
                {
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
                },
              ]
            }
            return EMPTY_ARRAY
          }
          return EMPTY_ARRAY
        }),
      )
    }),
  )
}
