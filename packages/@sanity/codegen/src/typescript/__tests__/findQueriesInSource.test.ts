import path from 'node:path'

import {describe, expect, test} from '@jest/globals'

import {findQueriesInSource} from '../findQueriesInSource'

describe('findQueries', () => {
  describe('should find queries in source', () => {
    test('plain string', () => {
      const source = `
      import { groq } from "groq";
      const postQuery = groq\`*[_type == "author"]\`
      const res = sanity.fetch(postQuery);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })

    test('with variables', () => {
      const source = `
      import { groq } from "groq";
      const type = "author";
      const authorQuery = groq\`*[_type == "\${type}"]\`
      const res = sanity.fetch(authorQuery);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })

    test('with function', () => {
      const source = `
      import { groq } from "groq";
      const getType = () => () => () => "author";
      const query = groq\`*[_type == "\${getType()()()}"]\`
      const res = sanity.fetch(query);
    `

      const queries = findQueriesInSource(source, 'test.ts')

      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })

    test('with block comment', () => {
      const source = `
        import { groq } from "groq";
        const type = "author";
        const query = /* groq */ groq\`*[_type == "\${type}"]\`;
        const res = sanity.fetch(query);
      `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })
  })

  test('should not find inline queries in source', () => {
    const source = `
        import { groq } from "groq";
        const res = sanity.fetch(groq\`*[_type == "author"]\`);
      `

    const queries = findQueriesInSource(source, 'test.ts')

    expect(queries.length).toBe(0)
  })

  test("should name queries with 'Result' at the end", () => {
    const source = `
      import { groq } from "groq";
      const postQuery = groq\`*[_type == "author"]\`
      const res = sanity.fetch(postQueryResult);
    `

    const queries = findQueriesInSource(source, 'test.ts')
    const queryResult = queries[0]

    expect(queryResult?.name.substr(-6)).toBe('Result')
  })

  test('should import', () => {
    const source = `
      import { groq } from "groq";
      import {foo}  from "./fixtures/exportVar";
      const postQuery = groq\`*[_type == "\${foo}"]\`
      const res = sanity.fetch(postQueryResult);
    `

    const resolver: NodeJS.RequireResolve = (id) => {
      if (id === 'foo') {
        return path.resolve(__dirname, 'fixtures', 'exportVar')
      }
      return require.resolve(id)
    }
    resolver.paths = (request: string): string[] | null => {
      return require.resolve.paths(request)
    }

    const queries = findQueriesInSource(source, 'test.ts', undefined, resolver)
    const queryResult = queries[0]

    expect(queryResult?.name.substr(-6)).toBe('Result')
  })
})
