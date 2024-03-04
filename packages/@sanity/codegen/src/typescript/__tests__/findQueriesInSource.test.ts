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
      const queryResult = queries.get('postQueryResult')

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
      const queryResult = queries.get('authorQueryResult')

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

      const queryResult = queries.get('queryResult')

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })

    test('with function arg', () => {
      const source = `
      import { groq } from "groq";
      function getType(type: string) {
        return type
      }

      const getArrowType = (type: string) => {
        return type
      }

      const query = groq\`*[_type == "\${getType("foo")}" || _type == "\${getArrowType("bar")}"]\`
      const res = () => sanity.fetch(query);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries.get('queryResult')

      expect(queryResult?.result).toEqual('*[_type == "foo" || _type == "bar"]')
    })

    test('with class methods', () => {
      const source = `
      import { groq } from "groq";
      class Test {
        unused() {
          return 123;
        }

        getType() {
          return "author";
        }

        static getId() {
          return "id"
        }

        static getFoo() {
          return "foo"
        }
      }
      const test = new Test();
      const query = groq\`*[_type == "\${test.getType()}"]\`
      const res = sanity.fetch(query);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries.get('queryResult')

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })

    test('with direct class methods', () => {
      const source = `
      import { groq } from "groq";
      class Test {
        getType() {
          return "author";
        }

        static getId() {
          return "id"
        }

        static getFoo() {
          return "foo"
        }
      }
      const query = groq\`*[_type == "\${(new Test()).getType()}" && _id == "\${Test.getId()}"]\`
      const res = sanity.fetch(query);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries.get('queryResult')

      expect(queryResult?.result).toEqual('*[_type == "author" && _id == "id"]')
    })

    test('with class static method', () => {
      const source = `
      import { groq } from "groq";
      class Test {
        static unused() {
          return "unused";
        }
        static getType() {
          return "author";
        }
      }
      const query = groq\`*[_type == "\${Test.getType()}"]\`
      const res = sanity.fetch(query);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries.get('queryResult')

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
      const queryResult = queries.get('queryResult')

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })
  })

  test('should not find inline queries in source', () => {
    const source = `
        import { groq } from "groq";
        const res = sanity.fetch(groq\`*[_type == "author"]\`);
      `

    const queries = findQueriesInSource(source, 'test.ts')

    expect(queries.size).toBe(0)
  })

  test("should name queries with 'Result' at the end", () => {
    const source = `
      import { groq } from "groq";
      const postQuery = groq\`*[_type == "author"]\`
      const res = sanity.fetch(postQueryResult);
    `

    const queries = findQueriesInSource(source, 'test.ts')
    const queryResult = queries.get('postQueryResult')

    expect(queryResult?.name).toBe('postQueryResult')
  })
})
