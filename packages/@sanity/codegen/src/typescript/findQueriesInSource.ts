import {createRequire} from 'node:module'

import {type TransformOptions, traverse} from '@babel/core'
import * as babelTypes from '@babel/types'

import {getBabelConfig} from '../getBabelConfig'
import {type NamedQueryResult, resolveExpression} from './expressionResolvers'
import {parseSourceFile} from './parseSource'

const require = createRequire(__filename)

const groqTagName = 'groq'

/**
 * findQueriesInSource takes a source string and returns all GROQ queries in it.
 * @param source - The source code to search for queries
 * @param filename - The filename of the source code
 * @param babelConfig - The babel configuration to use when parsing the source
 * @param resolver - A resolver function to use when resolving module imports
 * @returns
 * @beta
 * @internal
 */
export function findQueriesInSource(
  source: string,
  filename: string,
  babelConfig: TransformOptions = getBabelConfig(),
  resolver: NodeJS.RequireResolve = require.resolve,
): NamedQueryResult[] {
  const queries: NamedQueryResult[] = []
  const file = parseSourceFile(source, filename, babelConfig)

  traverse(file, {
    // Look for variable declarations, e.g. `const myQuery = groq`... and extract the query.
    // The variable name is used as the name of the query result type
    VariableDeclarator({node, scope}) {
      const init = node.init
      // Look for tagged template expressions that are called with the `groq` tag
      if (
        babelTypes.isTaggedTemplateExpression(init) &&
        babelTypes.isIdentifier(init.tag) &&
        babelTypes.isIdentifier(node.id) &&
        init.tag.name === groqTagName
      ) {
        const queryName = `${node.id.name}`
        const queryResult = resolveExpression({
          node: init,
          file,
          scope,
          babelConfig,
          filename,
          resolver,
        })
        queries.push({name: queryName, result: queryResult})
      }
    },
  })

  return queries
}
