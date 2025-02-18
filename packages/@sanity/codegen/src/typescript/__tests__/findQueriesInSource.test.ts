import {describe, expect, test, vi} from 'vitest'

import {findQueriesInSource} from '../findQueriesInSource'

// Mock require since it's not supported in vitest
vi.mock('node:module', () => ({
  createRequire: vi.fn().mockReturnValue({
    // Add the extension to the path
    resolve: vi.fn((path) => `${path}.ts`),
  }),
}))

describe('findQueries with the groq template', () => {
  describe('should find queries in source', () => {
    test('plain string', () => {
      const source = `
      import { groq } from "groq";
      const postQuery = groq\`*[_type == "author"]\`
      const res = sanity.fetch(postQuery);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.name).toEqual('postQuery')
      expect(queryResult?.result).toEqual('*[_type == "author"]')
      expect(queryResult?.location).toStrictEqual({
        end: {line: 3, column: 50, index: 86},
        start: {line: 3, column: 12, index: 48},
      })
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
      expect(queryResult?.location).toStrictEqual({
        end: {line: 4, column: 53, index: 118},
        start: {line: 4, column: 12, index: 77},
      })
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

    test('with function with literal parameters', () => {
      const source = `
      import { groq } from "groq";
      const getType = (type, x = '2') => () =>  \`\${type}\${x}\`;
      const query = groq\`*[_type == "\${getType("author")()}"]\`
      const res = sanity.fetch(query);
    `

      const queries = findQueriesInSource(source, 'test.ts')

      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author2"]')
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

  test('should import', () => {
    const source = `
      import { groq } from "groq";
      import {foo}  from "./fixtures/exportVar";
      const postQuery = groq\`*[_type == "\${foo}"]\`
      const res = sanity.fetch(postQueryResult);
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(1)
    expect(queries[0].result).toBe('*[_type == "foo"]')
  })

  test('should import, subdirectory', () => {
    const source = `
      import { groq } from "groq";
      import {foo}  from "../__tests__/fixtures/exportVar";
      const postQuery = groq\`*[_type == "\${foo}"]\`
      const res = sanity.fetch(postQueryResult);
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(1)
    expect(queries[0].result).toBe('*[_type == "foo"]')
  })

  test('can import sequence of files', () => {
    const source = `
      import { groq } from "groq";
      import {query}  from "../__tests__/fixtures/importSeq1";
      const someQuery = groq\`$\{query}\`
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(1)
    expect(queries[0].result).toBe('*[_type == "foo bar"]')
  })

  test('can import from export *', () => {
    const source = `
      import { groq } from "groq";
      import {foo}  from "./fixtures/exportStar";
      const postQuery = groq\`*[_type == "\${foo}"]\`
      const res = sanity.fetch(postQueryResult);
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(1)
    expect(queries[0].result).toBe('*[_type == "foo"]')
  })

  test('will ignore declarations with ignore tag', () => {
    const source = `
      import { groq } from "groq";

      // @sanity-typegen-ignore
      const postQuery = groq\`*[_type == "foo"]\`
    `

    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('will ignore export named declarations with ignore tag', () => {
    const source = `
      import { groq } from "groq";

      // @sanity-typegen-ignore
      export const postQuery = groq\`*[_type == "foo"]\`
    `

    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('will ignore declarations with ignore tag, even with multiple comments above declaration', () => {
    const source = `
      import { groq } from "groq";

      // This is a query that queries posts
      // @sanity-typegen-ignore
      export const postQuery = groq\`*[_type == "foo"]\`
    `

    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('will ignore declarations if any of the leading comments are ignore tags', () => {
    const source = `
      import { groq } from "groq";

      // @sanity-typegen-ignore
      // This should be ignored because of the comment above
      export const postQuery = groq\`*[_type == "foo"]\`
    `

    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('should remove unnecessary whitespace in queries', () => {
    const source = `
      import { groq } from "groq";
      const messyQuery = groq\`
        
        *[_type == "author"]    
        
      \`
      const res = sanity.fetch(messyQuery);
    `

    const queries = findQueriesInSource(source, 'test.ts')
    const queryResult = queries[0]

    expect(queryResult?.result).toEqual('*[_type == "author"]')
  })
})

describe('findQueries with defineQuery', () => {
  describe('should find queries in source', () => {
    test('plain string', () => {
      const source = `
      import { defineQuery } from "groq";
      const postQuery = defineQuery("*[_type == 'author']");
      const res = sanity.fetch(postQuery);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual("*[_type == 'author']")
    })

    test('template string', () => {
      const source = `
      import { defineQuery } from "groq";
      const postQuery = defineQuery(\`*[_type == "author"]\`);
      const res = sanity.fetch(postQuery);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })

    test('with variables', () => {
      const source = `
      import { defineQuery } from "groq";
      const type = "author";
      const authorQuery = defineQuery(\`*[_type == "\${type}"]\`);
      const res = sanity.fetch(authorQuery);
    `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })

    test('with function', () => {
      const source = `
      import { defineQuery } from "groq";
      const getType = () => () => () => "author";
      const query = defineQuery(\`*[_type == "\${getType()()()}"]\`);
      const res = sanity.fetch(query);
    `

      const queries = findQueriesInSource(source, 'test.ts')

      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })

    test('with block comment', () => {
      const source = `
        import { defineQuery } from "groq";
        const type = "author";
        const query = /* groq */ defineQuery(\`*[_type == "\${type}"]\`);
        const res = sanity.fetch(query);
      `

      const queries = findQueriesInSource(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })
  })

  test('should not find inline queries in source', () => {
    const source = `
        import { defineQuery } from "groq";
        const res = sanity.fetch(defineQuery(\`*[_type == "author"]\`));
      `

    const queries = findQueriesInSource(source, 'test.ts')

    expect(queries.length).toBe(0)
  })

  test('should import', () => {
    const source = `
      import {defineQuery} from "groq";
      import {foo}  from "./fixtures/exportVar";
      const postQuery = defineQuery(\`*[_type == "\${foo}"]\`);
      const res = sanity.fetch(postQueryResult);
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(1)
    expect(queries[0].result).toBe('*[_type == "foo"]')
  })

  test('should import, subdirectory', () => {
    const source = `
      import {defineQuery} from "groq";
      import {foo}  from "../__tests__/fixtures/exportVar";
      const postQuery = defineQuery(\`*[_type == "\${foo}"]\`);
      const res = sanity.fetch(postQueryResult);
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(1)
    expect(queries[0].result).toBe('*[_type == "foo"]')
  })

  test('can import sequence of files', () => {
    const source = `
      import {defineQuery} from "groq";
      import {query}  from "../__tests__/fixtures/importSeq1";
      const someQuery = defineQuery(\`$\{query}\`);
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(1)
    expect(queries[0].result).toBe('*[_type == "foo bar"]')
  })

  test('should detect defineQuery calls that have been required', () => {
    const source = `
      const {defineQuery} = require("groq");
      import {query}  from "../__tests__/fixtures/importSeq1";
      const someQuery = defineQuery(\`$\{query}\`);
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(1)
    expect(queries[0].result).toBe('*[_type == "foo bar"]')
  })

  test('will ignore declarations with ignore tag', () => {
    const source = `
      import {defineQuery} from "groq";

      // @sanity-typegen-ignore
      const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `

    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('will ignore export named declarations with ignore tag', () => {
    const source = `
      import {defineQuery} from "groq";

      // @sanity-typegen-ignore
      export const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `

    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('will ignore declarations with ignore tag, even with multiple comments above declaration', () => {
    const source = `
      import {defineQuery} from "groq";

      // This is a query that queries posts
      // @sanity-typegen-ignore
      export const postQuery = groq\`*[_type == "foo"]\`
    `

    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('will ignore declarations if any of the leading comments are ignore tags', () => {
    const source = `
      import {defineQuery} from "groq";

      // @sanity-typegen-ignore
      // This should be ignored because of the comment above
      export const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `

    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('will ignore defineQuery calls that are not coming from the groq module', () => {
    const source = `
      import {defineQuery} from "another-module";
      export const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('will ignore defineQuery calls that are not coming from the groq module when using require', () => {
    const source = `
      const {defineQuery} = require("another-module");
      export const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `
    const queries = findQueriesInSource(source, __filename, undefined)
    expect(queries.length).toBe(0)
  })

  test('can import from next-sanity', () => {
    const source = `
    import { defineQuery } from "next-sanity";
    const postQuery = defineQuery("*[_type == 'author']");
    const res = sanity.fetch(postQuery);
  `

    const queries = findQueriesInSource(source, 'test.ts')
    expect(queries.length).toBe(1)
    const queryResult = queries[0]

    expect(queryResult?.result).toEqual("*[_type == 'author']")
  })

  test('wont import from other package names', () => {
    const source = `
    import { defineQuery } from "other";
    const postQuery = defineQuery("*[_type == 'author']");
    const res = sanity.fetch(postQuery);
  `

    const queries = findQueriesInSource(source, 'test.ts')
    expect(queries.length).toBe(0)
  })
})
