import {describe, expect, it, jest} from '@jest/globals'

import {createIfNotExists} from '../../mutations'
import {type Migration, type NodeMigration} from '../../types'
import {
  createAsyncIterableMutation,
  normalizeMigrateDefinition,
} from '../normalizeMigrateDefinition'

const mockAsyncIterableIterator = () => {
  const data = [{_id: 'mockId', _type: 'mockDocumentType'}]
  let index = 0

  return {
    next: jest.fn().mockImplementation(() => {
      if (index < data.length) {
        return Promise.resolve({value: data[index++], done: false})
      }
      return Promise.resolve({value: undefined, done: true})
    }),
    [Symbol.asyncIterator]: jest.fn().mockImplementation(function (this: unknown) {
      return this
    }),
  }
}

describe('#normalizeMigrateDefinition', () => {
  it('should return the migrate is a function', async () => {
    const mockMigration: Migration = {
      title: 'mockMigration',
      documentTypes: ['mockDocumentType'],
      async *migrate() {
        yield createIfNotExists({_type: 'mockDocumentType', _id: 'mockId'})
      },
    }

    const result = normalizeMigrateDefinition(mockMigration)

    const res = []
    for await (const item of result(jest.fn() as any, {} as any)) {
      res.push(item)
    }

    expect(res.flat()).toEqual([createIfNotExists({_type: 'mockDocumentType', _id: 'mockId'})])
  })

  it('should return a new mutations if migrate is not a function', async () => {
    const mockMigration: Migration = {
      title: 'mockMigration',
      documentTypes: ['mockDocumentType'],
      migrate: {
        document() {
          return createIfNotExists({_type: 'mockDocumentType', _id: 'mockId'})
        },
      },
    }

    const result = normalizeMigrateDefinition(mockMigration)
    const res = []

    for await (const item of result(mockAsyncIterableIterator as any, {} as any)) {
      res.push(item)
    }

    expect(res.flat()).toEqual([createIfNotExists({_type: 'mockDocumentType', _id: 'mockId'})])
  })

  it('should not return undefined if migrate is returning undefined', async () => {
    const mockMigration: Migration = {
      title: 'mockMigration',
      documentTypes: ['mockDocumentType'],
      migrate: {
        document() {
          return undefined
        },
      },
    }

    const result = normalizeMigrateDefinition(mockMigration)
    const res = []

    for await (const item of result(mockAsyncIterableIterator as any, {} as any)) {
      res.push(item)
    }

    expect(res.flat()).toEqual([])
  })
})

describe('#createAsyncIterableMutation', () => {
  it('should return an async iterable', async () => {
    const mockMigration: NodeMigration = {
      document: jest.fn() as any,
    }

    const iterable = createAsyncIterableMutation(mockMigration, {documentTypes: ['foo']})

    expect(typeof iterable).toBe('function')

    const iterator = iterable(mockAsyncIterableIterator() as any, {} as any)
    expect(typeof iterator.next).toBe('function')
    expect(typeof iterator.return).toBe('function')
    expect(typeof iterator.throw).toBe('function')
  })
})
