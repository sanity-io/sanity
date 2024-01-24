import {renderHook} from '@testing-library/react'
import {buildRangeDecorationsFromComments} from '../buildRangeDecorationsFromComments'
import {CommentThreadItem} from '../../../types'

describe('buildRangeDecorationsFromComments', () => {
  it('can be tested', () => {
    const {result} = renderHook(() => buildRangeDecorationsFromComments({value: [], comments: []}))
    expect(result.current).toEqual([])
  })
  it('creates initial ranges', () => {
    const {result} = renderHook(() =>
      buildRangeDecorationsFromComments({value: initialValue, comments: initialComments}),
    )
    expect(result.current).toMatchSnapshot()
  })
  it('allows something to be bolded before the range', () => {
    const {result} = renderHook(() =>
      buildRangeDecorationsFromComments({value: boldedBeforeValue, comments: initialComments}),
    )
    expect(result.current).toMatchSnapshot()
  })
  it('allows something to be bolded inside the range', () => {
    const {result} = renderHook(() =>
      buildRangeDecorationsFromComments({value: boldedInsideValue, comments: initialComments}),
    )
    expect(result.current).toMatchSnapshot()
  })
})

const initialValue = [
  {
    _key: '6222e4072b6e',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'Hello there world',
        _key: '9d9c95878a6e0',
      },
    ],
    markDefs: [],
    _type: 'block',
    style: 'normal',
  },
]

const boldedBeforeValue = [
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

const boldedInsideValue = [
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

const initialComments: CommentThreadItem[] = [
  {
    selection: {
      type: 'text',
      value: [
        {
          _key: '6222e4072b6e',
          text: 'there',
        },
      ],
    },
    breadcrumbs: [],
    commentsCount: 0,
    fieldPath: '',
    replies: [],
    parentComment: {
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
        path: {
          field: '',
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
    threadId: 'de1f947c-93a7-4f71-9b9c-5f20023f9c98',
  },
]
