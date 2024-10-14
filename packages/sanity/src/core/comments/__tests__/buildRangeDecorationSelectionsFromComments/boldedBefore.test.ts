import {describe, expect, test} from 'vitest'

import {type CommentDocument} from '../../types'
import {buildRangeDecorationSelectionsFromComments, COMMENT_INDICATORS} from '../../utils'

describe('comments: buildRangeDecorationSelectionsFromComments', () => {
  test('keeps the range intact when text is bolded before the range', () => {
    const decoratorRanges = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
    })
    expect(decoratorRanges.map((r) => r.selection)).toEqual([
      {
        anchor: {offset: 1, path: [{_key: '6222e4072b6e'}, 'children', {_key: '5d176cf77466'}]},
        focus: {offset: 6, path: [{_key: '6222e4072b6e'}, 'children', {_key: '5d176cf77466'}]},
      },
    ])
  })
})

const value = [
  {
    _key: '6222e4072b6e',
    children: [
      {
        _type: 'span',
        marks: ['strong'],
        text: 'Hello',
        _key: '9d9c95878a6e0',
      },
      {
        _type: 'span',
        marks: [],
        _key: '5d176cf77466',
        text: ' there world',
      },
    ],
    markDefs: [],
    _type: 'block',
    style: 'normal',
  },
]

const comments: CommentDocument[] = [
  {
    _id: 'a14fb200-a4c4-4c44-b2c1-c17aa6d79aa8',
    _type: 'comment',
    _createdAt: '',
    _rev: '',
    authorId: '',
    message: null,
    threadId: '',
    status: 'open',
    reactions: null,
    target: {
      documentRevisionId: '',
      path: {
        field: '',
        selection: {
          type: 'text',
          value: [
            {
              _key: '6222e4072b6e',
              text: `Hello ${COMMENT_INDICATORS[0]}there${COMMENT_INDICATORS[1]} world`,
            },
          ],
        },
      },
      documentType: '',
      document: {
        _dataset: '',
        _projectId: '',
        _ref: '',
        _type: 'crossDatasetReference',
        _weak: false,
      },
    },
  },
]
