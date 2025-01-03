import {evaluate, parse, type ParseOptions} from 'groq-js'
import {vi} from 'vitest'

import {type FIXME} from '../../../FIXME'

export interface ClientWithFetch {
  withConfig: FIXME
  config: FIXME
  fetch: <R = FIXME, Q = Record<string, unknown>>(query: string, params?: Q) => Promise<R>
}
export function createMockClient(mockData: FIXME[]): ClientWithFetch {
  return {
    withConfig: vi.fn(() => createMockClient(mockData)),
    config: vi.fn(() => {
      return {
        url: 'https://mock.sanity.studio',
        apiVersion: '2021-03-25',
        dataset: 'mock',
        projectId: 'mock',
      }
    }),
    fetch: vi.fn(
      async <R = FIXME, Q = Record<string, unknown>>(query: string, params?: Q): Promise<R> => {
        try {
          const parseOptions: ParseOptions = {
            params: params as Record<string, unknown>,
          }

          const tree = parse(query, parseOptions)

          const value = await evaluate(tree, {
            dataset: mockData,
            params: params || {},
          })

          const result = await value.get()

          if (Array.isArray(result)) {
            return (query.endsWith('[0]') ? result[0] : result) as R
          }

          return result as R
        } catch (error) {
          if (error instanceof Error) {
            console.error('Error evaluating GROQ query:', error.message)
            if ('position' in error) {
              console.error('Error position:', (error as {position: number}).position)
            }
          }
          throw new Error('Error in mock client query execution')
        }
      },
    ),
  }
}

// Example usage:
// const mockData = [
//   { _id: 'doc1', _type: 'post', title: 'Hello World' },
//   { _id: 'doc2', _type: 'author', name: 'John Doe' }
// ]
// const client = createMockClient(mockData)
// const result = await client.fetch('*[_type == "post"][0]')
// console.log(result) // { _id: 'doc1', _type: 'post', title: 'Hello World' }
