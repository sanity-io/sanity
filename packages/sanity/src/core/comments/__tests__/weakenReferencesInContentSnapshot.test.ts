import {describe, expect, test} from 'vitest'

import {type CommentDocument} from '../types'
import {weakenReferencesInContentSnapshot} from '../utils/weakenReferencesInContentSnapshot'

interface BeforeAndAfter {
  before: CommentDocument['contentSnapshot']
  after: CommentDocument['contentSnapshot']
}

const WITH_REFERENCE: BeforeAndAfter = {
  before: [
    {
      _key: '45c3d74f7d00',
      _type: 'block',
      children: [
        {_key: '2ae5bdb4297f', _type: 'span', marks: [], text: 'ld '},
        {
          _key: 'ce4354994669',
          _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
          _type: 'strongAuthorRef',
        },
        {_key: 'b2b48e531409', _type: 'span', marks: [], text: ' lor'},
      ],
      markDefs: [],
      style: 'normal',
    },
  ],
  after: [
    {
      _key: '45c3d74f7d00',
      _type: 'block',
      children: [
        {_key: '2ae5bdb4297f', _type: 'span', marks: [], text: 'ld '},
        {
          _key: 'ce4354994669',
          _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
          _type: 'strongAuthorRef',
          _weak: true,
        },
        {_key: 'b2b48e531409', _type: 'span', marks: [], text: ' lor'},
      ],
      markDefs: [],
      style: 'normal',
    },
  ],
}

const WITH_REFERENCE_IN_OBJECT: BeforeAndAfter = {
  before: [
    {
      _key: '45c3d74f7d00',
      _type: 'block',
      children: [
        {_key: '2ae5bdb4297f', _type: 'span', marks: [], text: 'ld '},
        {
          _key: 'ce4354994669',
          _type: 'objectWithReference',
          strongAuthorRef: {
            _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
            _type: 'reference',
          },
        },
        {_key: 'b2b48e531409', _type: 'span', marks: [], text: ' lor'},
      ],
      markDefs: [],
      style: 'normal',
    },
  ],

  after: [
    {
      _key: '45c3d74f7d00',
      _type: 'block',
      children: [
        {_key: '2ae5bdb4297f', _type: 'span', marks: [], text: 'ld '},
        {
          _key: 'ce4354994669',
          _type: 'objectWithReference',
          strongAuthorRef: {
            _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
            _type: 'reference',
            _weak: true,
          },
        },
        {_key: 'b2b48e531409', _type: 'span', marks: [], text: ' lor'},
      ],
      markDefs: [],
      style: 'normal',
    },
  ],
}

const WITHOUT_REFERENCES: BeforeAndAfter = {
  before: [
    {
      _key: '45c3d74f7d00',
      _type: 'block',
      children: [
        {_key: '2ae5bdb4297f', _type: 'span', marks: [], text: 'ld '},
        {_key: 'b2b48e531409', _type: 'span', marks: [], text: ' lor'},
        {
          _key: 'b2b48e531409',
          _type: 'object',
          someValue: 'someValue',
        },
      ],
      markDefs: [],
      style: 'normal',
    },
  ],
  after: [
    {
      _key: '45c3d74f7d00',
      _type: 'block',
      children: [
        {_key: '2ae5bdb4297f', _type: 'span', marks: [], text: 'ld '},
        {_key: 'b2b48e531409', _type: 'span', marks: [], text: ' lor'},
        {
          _key: 'b2b48e531409',
          _type: 'object',
          someValue: 'someValue',
        },
      ],
      markDefs: [],
      style: 'normal',
    },
  ],
}

const SIMPLE_REFERENCE: BeforeAndAfter = {
  before: {
    _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
    _type: 'reference',
  },
  after: {
    _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
    _type: 'reference',
    _weak: true,
  },
}

const ARRAY_OF_REFERENCES: BeforeAndAfter = {
  before: [
    {
      _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
      _type: 'reference',
    },
    {
      _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
      _type: 'reference',
    },
    {
      _type: 'objectWithReference',
      strongAuthorRef: {
        _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
        _type: 'reference',
      },
    },
  ],
  after: [
    {
      _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
      _type: 'reference',
      _weak: true,
    },
    {
      _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
      _type: 'reference',
      _weak: true,
    },
    {
      _type: 'objectWithReference',
      strongAuthorRef: {
        _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
        _type: 'reference',
        _weak: true,
      },
    },
  ],
}

describe('comments: weakenReferencesInContentSnapshot', () => {
  test('should add a _weak property to reference in block', () => {
    const result = weakenReferencesInContentSnapshot(WITH_REFERENCE.before)

    expect(result).toEqual(WITH_REFERENCE.after)
  })

  test('should add a _weak property to reference in object', () => {
    const result = weakenReferencesInContentSnapshot(WITH_REFERENCE_IN_OBJECT.before)

    expect(result).toEqual(WITH_REFERENCE_IN_OBJECT.after)
  })

  test('should return original content snapshot if no reference is found', () => {
    const result = weakenReferencesInContentSnapshot(WITHOUT_REFERENCES.before)

    expect(result).toEqual(WITHOUT_REFERENCES.after)
  })

  test('should add a _weak property to a simple reference', () => {
    const result = weakenReferencesInContentSnapshot(SIMPLE_REFERENCE.before)

    expect(result).toEqual(SIMPLE_REFERENCE.after)
  })

  test('should add a _weak property to an array of references', () => {
    const result = weakenReferencesInContentSnapshot(ARRAY_OF_REFERENCES.before)

    expect(result).toEqual(ARRAY_OF_REFERENCES.after)
  })
})
