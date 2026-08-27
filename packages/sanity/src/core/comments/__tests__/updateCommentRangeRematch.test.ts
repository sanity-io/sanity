import {describe, expect, test} from 'vitest'

import {type CommentDocument} from '../types'
import {buildRangeDecorationSelectionsFromComments} from '../utils/inline-comments/buildRangeDecorationSelectionsFromComments'
import {selectionsToRange} from '../utils/inline-comments/selectionToRange'

const MARKER_START = '\uF000'
const MARKER_END = '\uF001'

function makeComment(selectionText: string): CommentDocument {
  return {
    _id: 'comment-1',
    target: {
      path: {
        field: 'body',
        selection: {
          type: 'text',
          value: [{_key: 'block-1', text: selectionText}],
        },
      },
    },
  } as unknown as CommentDocument
}

function makeValue(text: string) {
  return [
    {
      _type: 'block',
      _key: 'block-1',
      children: [{_type: 'span', _key: 'span-1', text}],
    },
  ]
}

describe('repro: comment on "World", then type before it', () => {
  test('rematch + selectionsToRange produce the SHIFTED range, not the stale one', () => {
    // Comment created on "World" in "Hello World" (offsets 6-11).
    // Stored marker text is the full block text with the fragment wrapped.
    const comment = makeComment(`Hello ${MARKER_START}World${MARKER_END}`)

    // User then types "XXX " at the very start of the block.
    const editorValue = makeValue('XXX Hello World')

    const decorations = buildRangeDecorationSelectionsFromComments({
      comments: [comment],
      value: editorValue,
    })

    expect(decorations).toHaveLength(1)

    const range = selectionsToRange(
      decorations.map((d) => d.selection),
      editorValue,
    )

    // "World" now sits at offsets 10-15. If this yields 6-11 the client is
    // persisting the creation-time offsets against the new fieldValue.
    expect(range).toEqual({
      start: {_key: 'block-1', offset: 10},
      end: {_key: 'block-1', offset: 15},
    })
  })

  test('range follows the editor value even when the form document value lags', () => {
    const comment = makeComment(`Hello ${MARKER_START}World${MARKER_END}`)

    // The editor has the typed text, but the form document value has not
    // received the flushed patches yet. Offsets must be computed against the
    // same value that is sent as `fieldValue` (the editor value), otherwise
    // the API stores markers at stale positions.
    const editorValue = makeValue('XXX Hello World')
    const staleDocumentValue = {_id: 'doc-1', _type: 'article', body: makeValue('Hello World')}

    const decorations = buildRangeDecorationSelectionsFromComments({
      comments: [comment],
      value: editorValue,
      documentValue: staleDocumentValue,
      basePath: ['body'],
    })

    const range = selectionsToRange(
      decorations.map((d) => d.selection),
      editorValue,
    )

    expect(range).toEqual({
      start: {_key: 'block-1', offset: 10},
      end: {_key: 'block-1', offset: 15},
    })
  })
})
