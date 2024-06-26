import {jest} from '@jest/globals'
import {type FIXME} from 'sanity'

// Import or recreate the ClientWithFetch interface
interface ClientWithFetch {
  fetch: <R = FIXME, Q = Record<string, unknown>>(query: string, params?: Q) => Promise<R>
}

// Type guard to check if a value is a non-null object
function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Mock client factory with return type
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
        throw new Error('Unexpected query or params in mock client')
      },
    ),
  }
}
