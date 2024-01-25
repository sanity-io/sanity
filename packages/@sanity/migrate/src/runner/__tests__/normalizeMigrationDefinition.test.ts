import {
  createAsyncIterableMutation,
  normalizeMigrateDefinition,
} from '../normalizeMigrateDefinition'
import {Migration, NodeMigration} from '../../types'

describe('#normalizeMigrateDefinition', () => {
  it('should return the migrate function if it is a function', () => {
    const mockMigration: Migration = {
      name: 'mockMigration',
      documentType: 'mockDocumentType',
      migrate: jest.fn(),
    }

    const result = normalizeMigrateDefinition(mockMigration)
    expect(result).toBe(mockMigration.migrate)
  })

  it('should return a new function if migrate is not a function', () => {
    const mockMigration: Migration = {
      name: 'mockMigration',
      documentType: 'mockDocumentType',
      migrate: {},
    }

    const result = normalizeMigrateDefinition(mockMigration)
    expect(typeof result).toBe('function')
  })
})

describe('#createAsyncIterableMutation', () => {
  const mockAsyncIterableIterator = () => {
    const data = ['item1', 'item2', 'item3'] // Sample data to be returned by the iterator
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

  it('should return an async iterable', async () => {
    const mockMigration: NodeMigration = {
      document: jest.fn(),
    }

    const iterable = createAsyncIterableMutation(mockMigration, {documentType: 'foo'})

    expect(typeof iterable).toBe('function')

    const iterator = iterable(mockAsyncIterableIterator(), {
      withDocument: jest.fn(),
    })
    expect(typeof iterator.next).toBe('function')
    expect(typeof iterator.return).toBe('function')
    expect(typeof iterator.throw).toBe('function')
  })
})
