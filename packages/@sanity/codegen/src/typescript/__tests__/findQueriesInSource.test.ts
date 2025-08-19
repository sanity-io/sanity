/* eslint-disable max-statements */
import path from 'node:path'

import {parseAst} from 'vite'
import {describe, expect, test} from 'vitest'

import {findQueriesInSource, type FindQueriesInSourceOptions} from '../findQueriesInSource'

function defineSource(
  files: {'/src/main': string} & Record<string, string>,
): FindQueriesInSourceOptions {
  const program = parseAst(files['/src/main'])

  const parsedFiles = Object.fromEntries(
    Object.entries(files).map(([filename, code]) => [filename, parseAst(code)]),
  )

  return {
    filename: '/src/main',
    program,
    comments: [],
    context: {
      resolve: (source, importer) => Promise.resolve(path.resolve(path.dirname(importer), source)),
      load: (id) => Promise.resolve(parsedFiles[id]),
    },
  }
}

describe('findQueriesInSource', () => {
  test('extracts queries tagged with the GROQ tag', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `const postQuery = groq\`*[_type == "author"]\``,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'postQuery'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test("extracts queries wrapped in defineQuery from the 'groq' package", async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const postQuery = defineQuery('*[_type == "author"]')
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'postQuery'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test("extracts queries wrapped in defineQuery from the 'next-sanity' package", async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'next-sanity'
          const postQuery = defineQuery('*[_type == "author"]')
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'postQuery'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('does not extract queries wrapped in defineQuery from other packages', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'other-package'
          const postQuery = defineQuery('*[_type == "author"]')
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toEqual([])
  })

  test('errors when resolving a complex tagged template expression', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const postQuery = defineQuery(complex.template.tag()\`*[_type == "author"]\`)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'postQuery' in /src/main: " +
          'Cannot resolve tagged template expression with complex tag. ' +
          'Only simple identifier tags are supported (e.g., \'groq`*[_type == "author"]`\'), but found a complex expression.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when resolving an unsupported templated tag', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const postQuery = defineQuery(unsupportedTag\`*[_type == "author"]\`)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'postQuery' in /src/main: " +
          "Cannot resolve tagged template with unsupported tag 'unsupportedTag'. " +
          "Remove the tag or configure 'extractableTagNames' to include 'unsupportedTag'.",
      },
    ])
    expect(queries).toEqual([])
  })

  test('extracts template literals with nested expressions', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const postQuery = defineQuery(groq\`*[_type == "\${'author'}"]\`)
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'postQuery'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('errors when resolving a regular expression literal', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const postQuery = defineQuery(/this should error/)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'postQuery' in /src/main: " +
          'Cannot resolve RegExp literal /this should error/. ' +
          'Regular expressions are not supported in query expressions.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('resolves series of identifiers to variable declaration', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const query = '*[_type == "author"]'
          const alias = query
          const postQuery = defineQuery(alias)
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'postQuery'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('errors when resolving series of circular identifiers', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const a = b
          const b = c
          const c = a
          const postQuery = defineQuery(a)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'postQuery' in /src/main: " +
          "Circular reference detected while resolving identifier 'b'.",
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when resolving an identifier that does not exist', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const postQuery = defineQuery(a)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'postQuery' in /src/main: " +
          "Could not resolve identifier 'a'. " +
          "Ensure it's defined in the current scope or imported.",
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when resolving a variable that does not have an initializer', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          let a
          a = 'not supported'
          const postQuery = defineQuery(a)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'postQuery' in /src/main: " +
          "Variable 'a' was declared without an initializer. " +
          'Queries must be assigned a value when declared.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when resolving variable declarations with assignment patterns', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const {foo} = {foo: 'not supported'}
          const query = defineQuery(foo)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Only simple variable declarations are supported for query identifiers. ' +
          'Found ObjectPattern instead of an identifier. Destructuring is not supported.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('resolves exported named variable declarations', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {a} from './a'
          const query = defineQuery(a)
        `,
        '/src/a': `
          export const a = 'from a'
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'from a',
      },
    ])
  })

  test('resolves exported specifier', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {a} from './a'
          const query = defineQuery(a)
        `,
        '/src/a': `
          const a = 'wrong a'
          const actuallyA = 'from a'
          export {actuallyA as a}
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'from a',
      },
    ])
  })

  test('resolves default export', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import a from './a'
          const query = defineQuery(a)
        `,
        '/src/a': `
          export default 'from a'
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'from a',
      },
    ])
  })

  test('resolves default export specifier', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import a from './a'
          const query = defineQuery(a)
        `,
        '/src/a': `
          const a = 'from a'
          export {a as default}
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'from a',
      },
    ])
  })

  test('resolves string literal export specifier', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {'string-literal-specifier' as a} from './a'
          const query = defineQuery(a)
        `,
        '/src/a': `
          const a = 'from a'
          export {a as 'string-literal-specifier'}
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'from a',
      },
    ])
  })

  test('errors when using namespace object directly', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import * as ns from './a'
          const query = defineQuery(ns)
        `,
        '/src/a': `
          export {}
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Cannot statically evaluate ObjectExpression expression. ' +
          'Only template literals, identifiers, function calls, member expressions, ' +
          'and simple literals are supported for query extraction.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('resolves named re-exports', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {'a' as a} from './re-export'
          const query = defineQuery(a)
        `,
        '/src/re-export': `
          export * from './b'
          export {a as 'a'} from './a'
        `,
        '/src/a': `
          const a = 'from a'
          export {a as 'a'}
        `,
        '/src/b': `
          export const b = 'from b'
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'from a',
      },
    ])
  })

  test('resolves default re-exports', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import a from './re-export-default'
          const query = defineQuery(a)
        `,
        '/src/re-export-default': "export {default} from './a'",
        '/src/a': "export default 'from a'",
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'from a',
      },
    ])
  })

  test('resolves export star re-exports', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {a} from './re-export'
          const query = defineQuery(a)
        `,
        '/src/re-export': `
          export * as ns from './skipped'
          export * from './b'
          export * from './a'
        `,
        '/src/a': "export const a = 'from a'",
        '/src/b': "export const b = 'from b'",
        '/src/skipped': 'export {}',
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'from a',
      },
    ])
  })

  test('resolves with circular re-exports loops', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {a} from './re-exports'
          const query = defineQuery(a)
        `,
        '/src/re-exports': `
          export * from './re-exports-1'
          export * from './re-exports-2'
          export * from './a'
        `,
        '/src/re-exports-1': "export * from './re-exports-2'",
        '/src/re-exports-2': "export * from './re-exports-1'",
        '/src/a': "export const a = 'from a'",
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'from a',
      },
    ])
  })

  test('extracts call expressions', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const fn = () => () => () => 'fn body'
          const query = defineQuery(fn()()())
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'fn body',
      },
    ])
  })

  test('times out when resolving call expressions that loop infinitely', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const a = () => b();
          const b = () => a();
          const query = defineQuery(a())
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Expression resolution timed out after 100ms. ' +
          'This could be due to a complex expression or an infinite loop.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('resolves identifiers from outer scopes', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const c = 'module scope'

          function fnScope() {
            const b = 'fn scope'

            function nestedScope() {
              const a = 'nested scope'
              const query = defineQuery(\`\${a} \${b} \${c}\`)
            }
          }
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'nested scope fn scope module scope',
      },
    ])
  })

  test('extracts call expressions applying arguments', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          const fn = (param) => \`fn body + \${param}\`
          const query1 = defineQuery(fn('arg1'))
          const query2 = defineQuery(fn('arg2'))
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query1'}},
        query: 'fn body + arg1',
      },
      {
        variable: {id: {name: 'query2'}},
        query: 'fn body + arg2',
      },
    ])
  })

  test('extracts curried call expressions', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const versionN = (major) => (minor) => (patch) =>
            \`\${major}.\${minor}.\${patch}\`

          const version1 = versionN(1)
          const version12 = version1(2)
          const version123 = version12(3)

          const version2 = versionN(2)
          const version21 = version2(1)
          const version210 = version21(0)

          const query123 = defineQuery(version123)
          const query210 = defineQuery(version210)
          const query999 = defineQuery(versionN(9)(9)(9))
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {variable: {id: {name: 'query123'}}, query: '1.2.3'},
      {variable: {id: {name: 'query210'}}, query: '2.1.0'},
      {variable: {id: {name: 'query999'}}, query: '9.9.9'},
    ])
  })

  test('two modules import the same module', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {versionN} from './versionN'
          import {version2} from './version2'

          const version123 = versionN(1)(2)(3)
          const version210 = version2(1)(0)

          const query123 = defineQuery(version123)
          const query210 = defineQuery(version210)
        `,
        '/src/version2': `
          import {versionN} from './versionN'
          export const version2 = versionN(2)
        `,
        '/src/versionN': `
          export const versionN = (major) => (minor) => (patch) =>
            \`\${major}.\${minor}.\${patch}\`
        `,
      }),
    )

    const err = errors.at(0)
    if (err) throw err

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {variable: {id: {name: 'query123'}}, query: '1.2.3'},
      {variable: {id: {name: 'query210'}}, query: '2.1.0'},
    ])
  })

  test('identifier reused twice in an expression', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {a} from './a'
          const doubleA = \`doubleA(\${a}, \${a})\`
          const query = defineQuery(\`\${a} \${a} \${doubleA}\`)
        `,
        '/src/a': `
          export const a = 'a!'
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'a! a! doubleA(a!, a!)',
      },
    ])
  })

  test('resolves function declaration identifiers', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          function getQuery() {
            return 'function declaration query'
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'function declaration query',
      },
    ])
  })

  test('resolves imported function declarations', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {getQuery, alsoGetQuery} from './functions'

          const query = defineQuery(getQuery())
          const alsoQuery = defineQuery(alsoGetQuery())
        `,
        '/src/functions': `
          export function getQuery() {
            return 'imported function query'
          }
          export {getQuery as alsoGetQuery}
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'imported function query',
      },
      {
        variable: {id: {name: 'alsoQuery'}},
        query: 'imported function query',
      },
    ])
  })

  test('resolves function expressions with block statements', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function() {
            return 'block statement query'
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'block statement query',
      },
    ])
  })

  test('resolves regular function declarations with block statements', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const type = 'wrong type'

          function getQuery() {
            const type = 'author'
            return \`*[_type == "\${type}"]\`
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('errors when function has multiple return statements', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function() {
            const ignoreThis = () => {
              return 'blah'
            }

            if (true) {
              return 'fdsa'
            }

            return 'second return'
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Function must have exactly one return statement to be statically evaluated, but found 2.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('does not error when function just one return statements', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const id = 'also wrong'
          const getQuery = function() {
            const id = 'wrong'
            const runThis = () => {
              const id = 'correct'
              return \`hey_\${id}\`
            }

            if (someCondition) {
              console.log('this is fine')
            }

            return runThis()
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'hey_correct',
      },
    ])
  })

  test('does not error when function just one return statements', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const id = 'also wrong'
          const getQuery = function() {
            const id = 'wrong'

            try {
              const id = 'correct'
              return \`hey_\${id}\`
            } catch (e) {
              console.error(e)
            }
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'hey_correct',
      },
    ])
  })

  test('errors when function has no return statement', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function() {
            const result = 'no return'
            // no return statement
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Function must have a return statement to be statically evaluated.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when resolving unsupported identifier definition types', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          try {
            throw new Error('test')
          } catch (errorVar) {
            const query = defineQuery(errorVar)
          }
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          "Unable to resolve identifier. Identifier 'errorVar' resolved to a " +
          "'CatchClause', which is not supported for static query resolution. " +
          'Only variables, imports, and function declarations are supported.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when trying to statically evaluate unsupported expression types', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const base = '*[_type == "author"]'
          const filter = ' && published'
          const query = defineQuery(base + filter)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message: expect.stringContaining(
          "Error while extracting query from variable 'query' in /src/main: " +
            'Cannot statically evaluate BinaryExpression expression.',
        ),
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when function has async modifier', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = async function() {
            return '*[_type == "author"]'
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Async functions are not supported as their Promise return value cannot be statically evaluated.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when function has generator modifier', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function*() {
            yield '*[_type == "author"]'
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Generator functions are not supported as their yielded values cannot be statically evaluated.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when function has unsupported parameter types', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function({type}) {
            return \`*[_type == "\${type}"]\`
          }

          const query = defineQuery(getQuery({type: 'author'}))
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message: expect.stringContaining(
          "Error while extracting query from variable 'query' in /src/main: " +
            "Unsupported parameter type 'ObjectPattern'.",
        ),
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when function call uses spread arguments', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function(type) {
            return \`*[_type == "\${type}"]\`
          }

          const args = ['author']
          const query = defineQuery(getQuery(...args))
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Spread arguments are not supported in function calls.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when function parameter has no value provided', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function(type) {
            return \`*[_type == "\${type}"]\`
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          "No value provided for parameter 'type'.",
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when function has empty return statement', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function() {
            return
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Return statement must return a value to be statically evaluated.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when trying to resolve non-function expressions as functions', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const queryObject = {
            get: () => '*[_type == "author"]'
          }

          const query = defineQuery(queryObject.get)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Cannot statically evaluate ArrowFunctionExpression expression. ' +
          'Only template literals, identifiers, function calls, member expressions, ' +
          'and simple literals are supported for query extraction.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when function has multiple return paths with if-else statements', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function(published) {
            if (published) {
              return '*[_type == "author" && published == true]'
            } else {
              return '*[_type == "author"]'
            }
          }

          const query = defineQuery(getQuery(true))
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Function must have exactly one return statement to be statically evaluated, but found 2.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when trying to resolve call expression with unsupported callee', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const queryString = '*[_type == "author"]'

          const query = defineQuery(queryString())
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Cannot statically evaluate Literal expression. ' +
          'Query extraction requires expressions that can be statically evaluated, ' +
          'but Literal is not supported.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('resolves function with default parameter when argument is omitted', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function(type = 'author') {
            return \`*[_type == "\${type}"]\`
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('resolves function with default parameter when argument is provided', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function(type = 'author') {
            return \`*[_type == "\${type}"]\`
          }

          const query = defineQuery(getQuery('post'))
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "post"]',
      },
    ])
  })

  test('resolves function with multiple default parameters', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function(type = 'author', published = true) {
            return \`*[_type == "\${type}" && published == \${published}]\`
          }

          const query = defineQuery(getQuery())
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author" && published == true]',
      },
    ])
  })

  test('resolves function with partial arguments using defaults for remaining', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function(type = 'author', published = true, limit = 10) {
            return \`*[_type == "\${type}" && published == \${published}][0..\${limit}]\`
          }

          const query = defineQuery(getQuery('post'))
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "post" && published == true][0..10]',
      },
    ])
  })

  test('resolves function with undefined argument using default parameter value', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function(type = 'author') {
            return \`*[_type == "\${type}"]\`
          }

          const query = defineQuery(getQuery(undefined))
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('resolves function with mixed undefined and defined arguments', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getQuery = function(type = 'author', published = true, limit = 10) {
            return \`*[_type == "\${type}" && published == \${published}][0..\${limit}]\`
          }

          const query = defineQuery(getQuery('post', undefined, 5))
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "post" && published == true][0..5]',
      },
    ])
  })

  test('resolves basic member expressions', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const some = {member: 'test'}
          const query = defineQuery(some.member)
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'test',
      },
    ])
  })

  test('resolves nested member expressions', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const some = {member: {expression: '*[_type == "author"]'}}
          const query = defineQuery(some.member.expression)
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('resolves computed member expressions with string literals', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const queries = {
            'author-query': '*[_type == "author"]',
            'post-query': '*[_type == "post"]'
          }
          const query = defineQuery(queries['author-query'])
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('resolves member expressions on imported objects', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import {queryConfig} from './config'

          const query = defineQuery(queryConfig.author)
        `,
        '/src/config': `
          export const queryConfig = {
            author: '*[_type == "author"]',
            post: '*[_type == "post"]'
          }
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('resolves member expressions on function call results', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const getConfig = (filter = 'true') => ({
            queries: {
              author: \`*[_type == "author" && \${filter}"]\`,
              book: \`*[_type == "book" && \${filter}]\`
            }
          })

          const authorQuery = defineQuery(getConfig("!(_id in path('drafts.**'))").queries.author)
          const bookQuery = defineQuery(getConfig().queries.book)
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'authorQuery'}},
        query: `*[_type == "author" && !(_id in path('drafts.**'))"]`,
      },
      {
        variable: {id: {name: 'bookQuery'}},
        query: `*[_type == "book" && true]`,
      },
    ])
  })

  test('errors when property does not exist in object literal', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const some = {member: 'test'}
          const query = defineQuery(some.nonexistent)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          "Property 'nonexistent' not found in object literal. " +
          'Ensure the property exists and is statically defined.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('errors when trying to access member on non-object expression', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const notAnObject = 'just a string'
          const query = defineQuery(notAnObject.member)
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message:
          "Error while extracting query from variable 'query' in /src/main: " +
          'Cannot statically evaluate Literal expression. ' +
          'Object member access requires expressions that resolve to object literals, ' +
          'but Literal is not supported.',
      },
    ])
    expect(queries).toEqual([])
  })

  test('resolves computed property access with resolvable expressions', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const some = {member: 'test'}
          const prop = 'member'
          const query = defineQuery(some[prop])
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: 'test',
      },
    ])
  })

  test('errors when computed property expression cannot be resolved', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const some = {member: 'test'}
          const query = defineQuery(some[Math.random()])
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message: expect.stringContaining(
          "Error while extracting query from variable 'query' in /src/main: " +
            "Could not resolve identifier 'Math'.",
        ),
      },
    ])
    expect(queries).toEqual([])
  })

  test('resolves member expressions with template literals', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'

          const config = {
            baseQuery: '*[_type == "author"]',
            filter: ' && published == true'
          }

          const query = defineQuery(\`\${config.baseQuery}\${config.filter}\`)
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"] && published == true',
      },
    ])
  })

  test('resolves namespace imports with member access', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import * as queries from './queries'

          const authorQuery = defineQuery(queries.author)
          const postQuery = defineQuery(queries.post)
        `,
        '/src/queries': `
          export const author = '*[_type == "author"]'
          export const post = '*[_type == "post"]'
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'authorQuery'}},
        query: '*[_type == "author"]',
      },
      {
        variable: {id: {name: 'postQuery'}},
        query: '*[_type == "post"]',
      },
    ])
  })

  test('resolves namespace imports with nested member access', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import * as utils from './utils'

          const query = defineQuery(utils.queries.author)
        `,
        '/src/utils': `
          export const queries = {
            author: '*[_type == "author"]',
            post: '*[_type == "post"]'
          }
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('resolves namespace imports with function exports', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import * as builders from './builders'

          const query = defineQuery(builders.createQuery('author'))
        `,
        '/src/builders': `
          export const createQuery = (type) => \`*[_type == "\${type}"]\`
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('resolves namespace imports with re-exported members', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import * as utils from './utils'

          const query = defineQuery(utils.authorQuery)
        `,
        '/src/utils': `
          export {author as authorQuery} from './queries'
        `,
        '/src/queries': `
          export const author = '*[_type == "author"]'
        `,
      }),
    )

    expect(errors).toEqual([])
    expect(queries).toMatchObject([
      {
        variable: {id: {name: 'query'}},
        query: '*[_type == "author"]',
      },
    ])
  })

  test('errors when namespace member does not exist', async () => {
    const {queries, errors} = await findQueriesInSource(
      defineSource({
        '/src/main': `
          import {defineQuery} from 'groq'
          import * as queries from './queries'

          const query = defineQuery(queries.nonexistent)
        `,
        '/src/queries': `
          export const author = '*[_type == "author"]'
        `,
      }),
    )

    expect(errors).toMatchObject([
      {
        message: expect.stringContaining(
          "Error while extracting query from variable 'query' in /src/main: " +
            "Could not find exported name 'nonexistent'",
        ),
      },
    ])
    expect(queries).toEqual([])
  })
})
