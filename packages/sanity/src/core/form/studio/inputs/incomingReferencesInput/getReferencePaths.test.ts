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
})
