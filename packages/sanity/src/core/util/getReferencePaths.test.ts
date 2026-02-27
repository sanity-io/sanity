import {describe, expect, it} from 'vitest'

import {getReferencePaths} from './getReferencePaths'

describe('getReferencePaths', () => {
  it('should return the reference path when the reference is at the root', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
      rootReference: {
        _ref: 'foo-bar',
        _type: 'reference',
      },
    }
    const referenceToId = 'foo-bar'
    const referencePaths = getReferencePaths(document, referenceToId)
    expect(referencePaths).toEqual([['rootReference']])
  })
  it('should return the reference path when the reference is at a nested object', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
      nestedReference: {
        nestedObject: {
          _ref: 'foo-bar',
          _type: 'reference',
        },
      },
    }
    const referenceToId = 'foo-bar'
    const referencePaths = getReferencePaths(document, referenceToId)
    expect(referencePaths).toEqual([['nestedReference', 'nestedObject']])
  })
  it('should return the reference path when the reference is in an array', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
      arrayReference: [
        {
          _ref: 'foo-bar',
          _type: 'reference',
          _key: 'item1',
        },
        {
          _ref: 'foo-bar-2',
          _type: 'reference',
          _key: 'item2',
        },
      ],
    }
    const referenceToId = 'foo-bar'
    const referencePaths = getReferencePaths(document, referenceToId)
    expect(referencePaths).toEqual([['arrayReference', {_key: 'item1'}]])
  })
  it('should return the reference path when the reference is in an object within an array', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
      arrayReference: {
        authors: [
          {
            _key: 'item1',
            nestedObject: {
              _ref: 'foo-bar',
              _type: 'reference',
            },
          },
        ],
      },
    }
    const referenceToId = 'foo-bar'
    const referencePaths = getReferencePaths(document, referenceToId)
    expect(referencePaths).toEqual([['arrayReference', 'authors', {_key: 'item1'}, 'nestedObject']])
  })
  it('should work for references with _type different from _ref', () => {
    const document = {
      _createdAt: '2025-08-04T08:25:28Z',
      _id: 'drafts.f42ed92a-c125-482e-883b-23b71a7beb5e',
      _rev: 'f71badd4-d138-4ac1-af74-ce0659ecf2ba',
      _type: 'arraysTest',
      _updatedAt: '2025-08-13T10:27:56Z',
      arrayOfNamedReferences: [
        {
          _key: '50ec4f259aea',
          _ref: '0ae4f72b-6571-4755-8b08-674bbb929a80',
          _type: 'authorReference',
        },
      ],
    }
    const referenceToId = '0ae4f72b-6571-4755-8b08-674bbb929a80'
    const referencePaths = getReferencePaths(document, referenceToId)
    expect(referencePaths).toEqual([['arrayOfNamedReferences', {_key: '50ec4f259aea'}]])
  })

  it('should return multiple paths when the same reference appears multiple times', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
      author: {_ref: 'foo-bar', _type: 'reference'},
      reviewer: {_ref: 'foo-bar', _type: 'reference'},
    }
    const referencePaths = getReferencePaths(document, 'foo-bar')
    expect(referencePaths).toEqual([['author'], ['reviewer']])
  })

  it('should return an empty array when no reference matches', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
      author: {_ref: 'other-id', _type: 'reference'},
    }
    const referencePaths = getReferencePaths(document, 'foo-bar')
    expect(referencePaths).toEqual([])
  })

  it('should use index for array items without _key', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
      items: [
        {_ref: 'other-id', _type: 'reference'},
        {_ref: 'foo-bar', _type: 'reference'},
      ],
    }
    const referencePaths = getReferencePaths(document, 'foo-bar')
    expect(referencePaths).toEqual([['items', 1]])
  })

  it('should handle null and undefined values gracefully', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
      nullField: null,
      undefinedField: undefined,
      author: {_ref: 'foo-bar', _type: 'reference'},
    }
    const referencePaths = getReferencePaths(document, 'foo-bar')
    expect(referencePaths).toEqual([['author']])
  })

  it('should return an empty array for a document with no user fields', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
    }
    const referencePaths = getReferencePaths(document, 'foo-bar')
    expect(referencePaths).toEqual([])
  })

  it('should find references within portable text blocks', () => {
    const document = {
      _type: 'test',
      _id: 'test',
      _createdAt: '2021-01-01',
      _updatedAt: '2021-01-01',
      _rev: 'test',
      body: [
        {
          _type: 'block',
          _key: 'block1',
          children: [{_type: 'span', _key: 'span1', text: 'Hello'}],
          markDefs: [
            {
              _key: 'link1',
              _type: 'internalLink',
              reference: {_ref: 'foo-bar', _type: 'reference'},
            },
          ],
        },
      ],
    }
    const referencePaths = getReferencePaths(document, 'foo-bar')
    expect(referencePaths).toEqual([
      ['body', {_key: 'block1'}, 'markDefs', {_key: 'link1'}, 'reference'],
    ])
  })
})
