import {type Path} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {type CommentDocument} from '../../types'
import {buildRangeDecorationSelectionsFromComments, COMMENT_INDICATORS} from '../../utils'

// A callout block in `body` whose `content` holds the commented text block.
const value = [
  {
    _key: 'callout',
    _type: 'callout',
    content: [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: 's1', marks: [], text: 'Hello there world'}],
      },
    ],
  },
]

const comment = (): CommentDocument => ({
  _id: 'c1',
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
      field: 'body[_key=="callout"].content',
      selection: {
        type: 'text',
        value: [
          {_key: 'b1', text: `Hello ${COMMENT_INDICATORS[0]}there${COMMENT_INDICATORS[1]} world`},
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
})

describe('comments: buildRangeDecorationSelectionsFromComments (nested container)', () => {
  test('body editor (inline): descends `field` and prefixes the decoration with the container path', () => {
    const [decoration] = buildRangeDecorationSelectionsFromComments({
      value,
      comments: [comment()],
      basePath: ['body'],
    })

    expect(decoration.selection).toEqual({
      anchor: {
        offset: 6,
        path: [{_key: 'callout'}, 'content', {_key: 'b1'}, 'children', {_key: 's1'}],
      },
      focus: {
        offset: 11,
        path: [{_key: 'callout'}, 'content', {_key: 'b1'}, 'children', {_key: 's1'}],
      },
    })
  })

  test('the litmus: the dialog editor resolves the same comment to the same span (shallower path, same offsets)', () => {
    const contentValue = value[0].content
    const dialogBasePath: Path = ['body', {_key: 'callout'}, 'content']

    const [decoration] = buildRangeDecorationSelectionsFromComments({
      value: contentValue,
      comments: [comment()],
      basePath: dialogBasePath,
    })

    expect(decoration.selection).toEqual({
      anchor: {offset: 6, path: [{_key: 'b1'}, 'children', {_key: 's1'}]},
      focus: {offset: 11, path: [{_key: 'b1'}, 'children', {_key: 's1'}]},
    })
  })
})
