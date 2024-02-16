import {describe, expect, it} from '@jest/globals'

import {type CommentDocument} from '../types'
import {buildRangeDecorationSelectionsFromComments} from '../utils'

describe('comments: buildRangeDecorationSelectionsFromComments', () => {
  it('creates initial ranges', () => {
    const decoratorRanges = buildRangeDecorationSelectionsFromComments({
      value: initialValue,
      comments: initialComments,
    })
    expect(decoratorRanges.map((r) => r.selection)).toMatchSnapshot()
  })
  it('allows something to be bolded before the range', () => {
    const decoratorRanges = buildRangeDecorationSelectionsFromComments({
      value: boldedBeforeValue,
      comments: initialComments,
    })
    expect(decoratorRanges.map((r) => r.selection)).toMatchSnapshot()
  })
  it('allows something to be bolded inside the range', () => {
    const decoratorRanges = buildRangeDecorationSelectionsFromComments({
      value: boldedInsideValue,
      comments: initialComments,
    })
    expect(decoratorRanges.map((r) => r.selection)).toMatchSnapshot()
  })
  it('allows something to be bolded inside and outside of the range', () => {
    const decoratorRanges = buildRangeDecorationSelectionsFromComments({
      value: boldedInsideAndOutsideValue,
      comments: initialComments,
    })
    expect(decoratorRanges.map((r) => r.selection)).toMatchSnapshot()
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

const boldedInsideAndOutsideValue = [
  {
    _key: '6222e4072b6e',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'Hel',
        _key: '9d9c95878a6e0',
      },
      {
        _type: 'span',
        marks: ['strong'],
        _key: '897d8881c889',
        text: 'lo th',
      },
      {
        _type: 'span',
        marks: [],
        _key: '3b404dd88fc1',
        text: 'ere world',
      },
    ],
    markDefs: [],
    _type: 'block',
    style: 'normal',
  },
]

const initialComments: CommentDocument[] = [
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
      path: {
        field: '',
        selection: {
          type: 'text',
          value: [
            {
              _key: '6222e4072b6e',
              text: 'Hello <comment>there</comment> world',
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
