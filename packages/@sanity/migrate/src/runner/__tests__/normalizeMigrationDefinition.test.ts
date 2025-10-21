import {type SanityDocument} from '@sanity/types'
import {describe, expect, it, vitest} from 'vitest'

import {createIfNotExists} from '../../mutations/creators'
import {type Migration, type MigrationContext, type NodeMigration} from '../../types'
import {
  createAsyncIterableMutation,
  normalizeMigrateDefinition,
} from '../normalizeMigrateDefinition'

const mockAsyncIterableIterator = () => {
  const data: SanityDocument[] = [
    {
      _id: 'mockId',
      _type: 'mockDocumentType',
      _updatedAt: '2024-02-16T14:13:59Z',
      _rev: 'xyz',
      _createdAt: '2024-02-16T14:13:59Z',
    },
  ]
  return async function* documents() {
    for (let index = 0; index < data.length; index++) {
      yield data[index]
    }
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
    for await (const item of result(vitest.fn(), {} as any)) {
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

    for await (const item of result(mockAsyncIterableIterator(), {} as any)) {
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

    for await (const item of result(mockAsyncIterableIterator(), {} as any)) {
      res.push(item)
    }

    expect(res.flat()).toEqual([])
  })
})

describe('#createAsyncIterableMutation', () => {
  it('should return an async iterable', async () => {
    const mockMigration: NodeMigration = {
      document: vitest.fn(),
    }

    const iterable = createAsyncIterableMutation(mockMigration, {documentTypes: ['foo']})

    expect(typeof iterable).toBe('function')

    const iterator = iterable(mockAsyncIterableIterator(), {} as MigrationContext)
    expect(typeof iterator.next).toBe('function')
    expect(typeof iterator.return).toBe('function')
    expect(typeof iterator.throw).toBe('function')
  })
})
