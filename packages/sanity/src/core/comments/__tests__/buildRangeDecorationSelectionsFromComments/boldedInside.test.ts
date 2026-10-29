import {describe, expect, test} from 'vitest'

import {type CommentDocument} from '../../types'
import {
  buildRangeDecorationSelectionsFromComments,
  COMMENT_INDICATORS,
} from '../../utils/inline-comments/buildRangeDecorationSelectionsFromComments'

describe('comments: buildRangeDecorationSelectionsFromComments', () => {
  test('keeps the range intact when text is bolded inside the range', () => {
    const decoratorRanges = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
    })
    expect(decoratorRanges.map((r) => r.selection)).toEqual([
      {
        anchor: {offset: 6, path: [{_key: '6222e4072b6e'}, 'children', {_key: '9d9c95878a6e0'}]},
        focus: {offset: 2, path: [{_key: '6222e4072b6e'}, 'children', {_key: '8daa33e86194'}]},
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
        marks: [],
        text: 'Hello th',
        _key: '9d9c95878a6e0',
      },
      {
        _type: 'span',
        marks: ['strong'],
        _key: 'ea97036ed5c4',
        text: 'e',
      },
      {
        _type: 'span',
        marks: [],
        _key: '8daa33e86194',
        text: 're world',
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
