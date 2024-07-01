import {jest} from '@jest/globals'
import {type FIXME} from 'sanity'

interface ClientWithFetch {
  fetch: <R = FIXME, Q = Record<string, unknown>>(query: string, params?: Q) => Promise<R>
}

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function createMockClient(mockData: Record<string, FIXME> = {}): ClientWithFetch {
  return {
    fetch: jest.fn(
      async <R = FIXME, Q = Record<string, unknown>>(query: string, params?: Q): Promise<R> => {
        // Simple mock implementation that returns data based on the ref
        if (
          query.includes('*[_type == $type &&_id == $ref][0]') &&
          isNonNullObject(params) &&
          'ref' in params
        ) {
          const ref = params.ref as string
          if (typeof ref === 'string' && ref in mockData) {
            return mockData[ref] as R
          }
        }
        if (query.includes('*[_id == $id][0]') && isNonNullObject(params) && 'id' in params) {
          const id = params.id as string
          if (typeof id === 'string' && id in mockData) {
            return mockData[id] as R
          }
        }
        throw new Error('Unexpected query or params in mock client')
      },
    ),
  }
}
