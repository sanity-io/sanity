/* eslint-disable max-nested-callbacks */
import {describe, expect, test} from '@jest/globals'

import {findAllQueriesInSource, findNamedQueriesInSource} from '../findQueriesInSource'

const SupportNamedOnly = 'namedOnly' as const
const SupportUnnamedOnly = 'unnamedOnly' as const
const SupportNamed = 'named' as const
const SupportComments = 'comments' as const
const SupportUnnamed = 'unnamed' as const
type Support =
  | typeof SupportNamed
  | typeof SupportNamedOnly
  | typeof SupportUnnamedOnly
  | typeof SupportComments
  | typeof SupportUnnamed

const tests = [
  {
    name: 'findNamedQueriesInSource',
    testMethod: findNamedQueriesInSource,
    supports: new Set<Support>(['named']),
  },
  {
    name: 'findAllQueriesInSource',
    testMethod: findAllQueriesInSource,
    supports: new Set<Support>(['comments', 'named', 'unnamed']),
  },
]

const testIfSupports = (
  wanted: Support[],
  supports: Set<Support>,
  name: string,
  fn: () => void,
) => {
  if (wanted.every((w) => supports.has(w))) {
    return test(name, fn)
  }
  return test.skip(name, fn)
}

const describeIfSupports = (
  wanted: Support[],
  supports: Set<Support>,
  name: string,
  fn: () => void,
) => {
  if (wanted.every((w) => supports.has(w))) {
    return describe(name, fn)
  }
  return describe.skip(name, fn)
}

describe.each(tests)('$name', ({testMethod, supports}) => {
  describe('GROQ Templates', () => {
    describe('should find queries in source', () => {
      testIfSupports([SupportNamedOnly], supports, 'plain string', () => {
        const source = `
      import { groq } from "groq";
      const postQuery = groq\`*[_type == "author"]\`
      const res = sanity.fetch(postQuery);
    `

        const queries = testMethod(source, 'test.ts')
        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
        expect(queryResult?.location).toStrictEqual({
          end: {line: 3, column: 50, index: 86},
          start: {line: 3, column: 12, index: 48},
        })
      })

      testIfSupports([SupportUnnamedOnly], supports, 'plain string', () => {
        const source = `
      import { groq } from "groq";
      const postQuery = groq\`*[_type == "author"]\`
      const res = sanity.fetch(postQuery);
    `

        const queries = testMethod(source, 'test.ts')
        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
        expect(queryResult?.location).toStrictEqual({
          end: {line: 3, column: 50, index: 86},
          start: {line: 3, column: 24, index: 60},
        })
      })

      testIfSupports([SupportNamedOnly], supports, 'with variables', () => {
        const source = `
      import { groq } from "groq";
      const type = "author";
      const authorQuery = groq\`*[_type == "\${type}"]\`
      const res = sanity.fetch(authorQuery);
    `

        const queries = testMethod(source, 'test.ts')
        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
        expect(queryResult?.location).toStrictEqual({
          end: {line: 4, column: 53, index: 118},
          start: {line: 4, column: 12, index: 77},
        })
      })

      testIfSupports([SupportUnnamedOnly], supports, 'with variables', () => {
        const source = `
      import { groq } from "groq";
      const type = "author";
      const authorQuery = groq\`*[_type == "\${type}"]\`
      const res = sanity.fetch(authorQuery);
    `

        const queries = testMethod(source, 'test.ts')
        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
        expect(queryResult?.location).toStrictEqual({
          end: {line: 4, column: 53, index: 118},
          start: {line: 4, column: 26, index: 91},
        })
      })

      testIfSupports([SupportNamed], supports, 'with function', () => {
        const source = `
      import { groq } from "groq";
      const getType = () => () => () => "author";
      const query = groq\`*[_type == "\${getType()()()}"]\`
      const res = sanity.fetch(query);
    `

        const queries = testMethod(source, 'test.ts')

        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
      })

      testIfSupports([SupportNamed], supports, 'with block comment', () => {
        const source = `
        import { groq } from "groq";
        const type = "author";
        const query = /* groq */ groq\`*[_type == "\${type}"]\`;
        const res = sanity.fetch(query);
      `

        const queries = testMethod(source, 'test.ts')
        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
      })
    })

    testIfSupports([SupportNamedOnly], supports, 'should not find inline queries in source', () => {
      const source = `
        import { groq } from "groq";
        const res = sanity.fetch(groq\`*[_type == "author"]\`);
      `

      const queries = testMethod(source, 'test.ts')

      expect(queries.length).toBe(0)
    })

    testIfSupports([SupportNamed], supports, 'should import', () => {
      const source = `
      import { groq } from "groq";
      import {foo}  from "./fixtures/exportVar";
      const postQuery = groq\`*[_type == "\${foo}"]\`
      const res = sanity.fetch(postQueryResult);
    `
      const queries = testMethod(source, __filename, undefined)
      expect(queries.length).toBe(1)
      expect(queries[0].result).toBe('*[_type == "foo"]')
    })

    testIfSupports([SupportNamed], supports, 'should import, subdirectory', () => {
      const source = `
      import { groq } from "groq";
      import {foo}  from "../__tests__/fixtures/exportVar";
      const postQuery = groq\`*[_type == "\${foo}"]\`
      const res = sanity.fetch(postQueryResult);
    `
      const queries = testMethod(source, __filename, undefined)
      expect(queries.length).toBe(1)
      expect(queries[0].result).toBe('*[_type == "foo"]')
    })

    testIfSupports([SupportNamed], supports, 'can import sequence of files', () => {
      const source = `
      import { groq } from "groq";
      import {query}  from "../__tests__/fixtures/importSeq1";
      const someQuery = groq\`$\{query}\`
    `
      const queries = testMethod(source, __filename, undefined)
      expect(queries.length).toBe(1)
      expect(queries[0].result).toBe('*[_type == "foo bar"]')
    })

    testIfSupports([SupportNamed], supports, 'will ignore declarations with ignore tag', () => {
      const source = `
      import { groq } from "groq";

      // @sanity-typegen-ignore
      const postQuery = groq\`*[_type == "foo"]\`
    `

      const queries = testMethod(source, __filename, undefined)
      expect(queries.length).toBe(0)
    })

    testIfSupports(
      [SupportNamed],
      supports,
      'will ignore export named declarations with ignore tag',
      () => {
        const source = `
      import { groq } from "groq";

      // @sanity-typegen-ignore
      export const postQuery = groq\`*[_type == "foo"]\`
    `

        const queries = testMethod(source, __filename, undefined)
        expect(queries.length).toBe(0)
      },
    )

    testIfSupports(
      [SupportNamed],
      supports,
      'will ignore declarations with ignore tag, even with multiple comments above declaration',
      () => {
        const source = `
      import { groq } from "groq";

      // This is a query that queries posts
      // @sanity-typegen-ignore
      export const postQuery = groq\`*[_type == "foo"]\`
    `

        const queries = testMethod(source, __filename, undefined)
        expect(queries.length).toBe(0)
      },
    )

    testIfSupports(
      [SupportNamed],
      supports,
      'will ignore declerations if any of the leading comments are ignore tags',
      () => {
        const source = `
      import { groq } from "groq";

      // @sanity-typegen-ignore
      // This should be ignored because of the comment above
      export const postQuery = groq\`*[_type == "foo"]\`
    `

        const queries = testMethod(source, __filename, undefined)
        expect(queries.length).toBe(0)
      },
    )
  })

  describe('with defineQuery', () => {
    describe('should find queries in source', () => {
      testIfSupports([SupportNamed], supports, 'plain string', () => {
        const source = `
      import { defineQuery } from "groq";
      const postQuery = defineQuery("*[_type == 'author']");
      const res = sanity.fetch(postQuery);
    `

        const queries = testMethod(source, 'test.ts')
        const queryResult = queries[0]

        expect(queryResult?.result).toEqual("*[_type == 'author']")
      })

      testIfSupports([SupportNamed], supports, 'template string', () => {
        const source = `
      import { defineQuery } from "groq";
      const postQuery = defineQuery(\`*[_type == "author"]\`);
      const res = sanity.fetch(postQuery);
    `

        const queries = testMethod(source, 'test.ts')
        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
      })

      testIfSupports([SupportNamed], supports, 'with variables', () => {
        const source = `
      import { defineQuery } from "groq";
      const type = "author";
      const authorQuery = defineQuery(\`*[_type == "\${type}"]\`);
      const res = sanity.fetch(authorQuery);
    `

        const queries = testMethod(source, 'test.ts')
        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
      })

      testIfSupports([SupportNamed], supports, 'with function', () => {
        const source = `
      import { defineQuery } from "groq";
      const getType = () => () => () => "author";
      const query = defineQuery(\`*[_type == "\${getType()()()}"]\`);
      const res = sanity.fetch(query);
    `

        const queries = testMethod(source, 'test.ts')

        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
      })

      testIfSupports([SupportNamed], supports, 'with block comment', () => {
        const source = `
        import { defineQuery } from "groq";
        const type = "author";
        const query = /* groq */ defineQuery(\`*[_type == "\${type}"]\`);
        const res = sanity.fetch(query);
      `

        const queries = testMethod(source, 'test.ts')
        const queryResult = queries[0]

        expect(queryResult?.result).toEqual('*[_type == "author"]')
      })
    })

    testIfSupports([SupportNamedOnly], supports, 'should not find inline queries in source', () => {
      const source = `
        import { defineQuery } from "groq";
        const res = sanity.fetch(defineQuery(\`*[_type == "author"]\`));
      `

      const queries = testMethod(source, 'test.ts')

      expect(queries.length).toBe(0)
    })

    testIfSupports([SupportNamed], supports, 'should import', () => {
      const source = `
      import {defineQuery} from "groq";
      import {foo}  from "./fixtures/exportVar";
      const postQuery = defineQuery(\`*[_type == "\${foo}"]\`);
      const res = sanity.fetch(postQueryResult);
    `
      const queries = testMethod(source, __filename, undefined)
      expect(queries.length).toBe(1)
      expect(queries[0].result).toBe('*[_type == "foo"]')
    })

    testIfSupports([SupportNamed], supports, 'should import, subdirectory', () => {
      const source = `
      import {defineQuery} from "groq";
      import {foo}  from "../__tests__/fixtures/exportVar";
      const postQuery = defineQuery(\`*[_type == "\${foo}"]\`);
      const res = sanity.fetch(postQueryResult);
    `
      const queries = testMethod(source, __filename, undefined)
      expect(queries.length).toBe(1)
      expect(queries[0].result).toBe('*[_type == "foo"]')
    })

    testIfSupports([SupportNamed], supports, 'can import sequence of files', () => {
      const source = `
      import {defineQuery} from "groq";
      import {query}  from "../__tests__/fixtures/importSeq1";
      const someQuery = defineQuery(\`$\{query}\`);
    `
      const queries = testMethod(source, __filename, undefined)
      expect(queries.length).toBe(1)
      expect(queries[0].result).toBe('*[_type == "foo bar"]')
    })

    testIfSupports(
      [SupportNamed],
      supports,
      'should detect defineQuery calls that have been required',
      () => {
        const source = `
      const {defineQuery} = require("groq");
      import {query}  from "../__tests__/fixtures/importSeq1";
      const someQuery = defineQuery(\`$\{query}\`);
    `
        const queries = testMethod(source, __filename, undefined)
        expect(queries.length).toBe(1)
        expect(queries[0].result).toBe('*[_type == "foo bar"]')
      },
    )

    testIfSupports([SupportNamed], supports, 'will ignore declarations with ignore tag', () => {
      const source = `
      import {defineQuery} from "groq";

      // @sanity-typegen-ignore
      const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `

      const queries = testMethod(source, __filename, undefined)
      expect(queries.length).toBe(0)
    })

    testIfSupports(
      [SupportNamed],
      supports,
      'will ignore export named declarations with ignore tag',
      () => {
        const source = `
      import {defineQuery} from "groq";

      // @sanity-typegen-ignore
      export const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `

        const queries = testMethod(source, __filename, undefined)
        expect(queries.length).toBe(0)
      },
    )

    testIfSupports(
      [SupportNamed],
      supports,
      'will ignore declarations with ignore tag, even with multiple comments above declaration',
      () => {
        const source = `
      import {defineQuery} from "groq";

      // This is a query that queries posts
      // @sanity-typegen-ignore
      export const postQuery = groq\`*[_type == "foo"]\`
    `

        const queries = testMethod(source, __filename, undefined)
        expect(queries.length).toBe(0)
      },
    )

    testIfSupports(
      [SupportNamed],
      supports,
      'will ignore declerations if any of the leading comments are ignore tags',
      () => {
        const source = `
      import {defineQuery} from "groq";

      // @sanity-typegen-ignore
      // This should be ignored because of the comment above
      export const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `

        const queries = testMethod(source, __filename, undefined)
        expect(queries.length).toBe(0)
      },
    )

    testIfSupports(
      [SupportNamed],
      supports,
      'will ignore defineQuery calls that are not coming from the groq module',
      () => {
        const source = `
      import {defineQuery} from "another-module";
      export const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `
        const queries = testMethod(source, __filename, undefined)
        expect(queries.length).toBe(0)
      },
    )

    testIfSupports(
      [SupportNamed],
      supports,
      'will ignore defineQuery calls that are not coming from the groq module when using require',
      () => {
        const source = `
      const {defineQuery} = require("another-module");
      export const postQuery = defineQuery(\`*[_type == "foo"]\`);
    `
        const queries = testMethod(source, __filename, undefined)
        expect(queries.length).toBe(0)
      },
    )

    testIfSupports([SupportNamed], supports, 'can import from next-sanity', () => {
      const source = `
    import { defineQuery } from "next-sanity";
    const postQuery = defineQuery("*[_type == 'author']");
    const res = sanity.fetch(postQuery);
  `

      const queries = testMethod(source, 'test.ts')
      expect(queries.length).toBe(1)
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual("*[_type == 'author']")
    })

    testIfSupports([SupportNamed], supports, 'wont import from other package names', () => {
      const source = `
    import { defineQuery } from "other";
    const postQuery = defineQuery("*[_type == 'author']");
    const res = sanity.fetch(postQuery);
  `

      const queries = testMethod(source, 'test.ts')
      expect(queries.length).toBe(0)
    })
  })

  describeIfSupports([SupportComments], supports, 'findQueries with groq-comment', () => {
    test('plain string', () => {
      const source = `
      const postQuery = /* groq */"*[_type == 'author']";
      const res = sanity.fetch(postQuery);
    `

      const queries = testMethod(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual("*[_type == 'author']")
    })

    test('template string', () => {
      const source = `
      const postQuery = /* groq */\`*[_type == "author"]\`;
      const res = sanity.fetch(postQuery);
    `

      const queries = testMethod(source, 'test.ts')
      const queryResult = queries[0]

      expect(queryResult?.result).toEqual('*[_type == "author"]')
    })

    test('should find inline queries in source', () => {
      const source = `
        import { defineQuery } from "groq";
        const res = sanity.fetch(/* groq */\`*[_type == "author"]\`);
      `

      const queries = testMethod(source, 'test.ts')

      expect(queries.length).toBe(1)
    })
  })
})
