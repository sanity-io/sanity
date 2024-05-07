import {createRequire} from 'node:module'

import {type NodePath, type TransformOptions, traverse} from '@babel/core'
import * as babelTypes from '@babel/types'

import {getBabelConfig} from '../getBabelConfig'
import {type NamedQueryResult, resolveExpression} from './expressionResolvers'
import {parseSourceFile} from './parseSource'

const require = createRequire(__filename)

const groqTagName = 'groq'

const ignoreValue = '@sanity-typegen-ignore'

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
    VariableDeclarator(path) {
      const {node, scope} = path

      const init = node.init

      // Look for tagged template expressions that are called with the `groq` tag
      if (
        babelTypes.isTaggedTemplateExpression(init) &&
        babelTypes.isIdentifier(init.tag) &&
        babelTypes.isIdentifier(node.id) &&
        init.tag.name === groqTagName
      ) {
        // If we find a comment leading the decleration which macthes with ignoreValue we don't add
        // the query
        if (declarationLeadingCommentContains(path, ignoreValue)) {
          return
        }

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

function declarationLeadingCommentContains(path: NodePath, comment: string): boolean {
  /*
   * We have to consider these cases:
   *
   * // @sanity-typegen-ignore
   * const query = groq`...`
   *
   * // AST
   * VariableDeclaration {
   *   declarations: [
   *     VariableDeclarator: {init: tag: {name: "groq"}}
   *   ],
   *   leadingComments: ...
   * }
   *
   * // @sanity-typegen-ignore
   * const query1 = groq`...`, query2 = groq`...`
   *
   * // AST
   * VariableDeclaration {
   *   declarations: [
   *     VariableDeclarator: {init: tag: {name: "groq"}}
   *     VariableDeclarator: {init: tag: {name: "groq"}}
   *   ],
   *   leadingComments: ...
   * }
   *
   * // @sanity-typegen-ignore
   * export const query = groq`...`
   *
   * // AST
   * ExportNamedDeclaration {
   *   declaration: VariableDeclaration {
   *     declarations: [
   *       VariableDeclarator: {init: tag: {name: "groq"}}
   *       VariableDeclarator: {init: tag: {name: "groq"}}
   *     ],
   *   },
   *   leadingComments: ...
   * }
   *
   * In the case where multiple variables are under the same VariableDeclaration the leadingComments
   * will still be on the VariableDeclaration
   *
   * In the case where the variable is exported, the leadingComments are on the
   * ExportNamedDeclaration which includes the VariableDeclaration in its own declaration property
   */

  const variableDeclaration = path.find((node) => node.isVariableDeclaration())
  if (!variableDeclaration) return false

  if (
    variableDeclaration.node.leadingComments?.find(
      (commentItem) => commentItem.value.trim() === comment,
    )
  ) {
    return true
  }

  // If the declaration is exported, the comment lies on the parent of the export declaration
  if (
    variableDeclaration.parent.leadingComments?.find(
      (commentItem) => commentItem.value.trim() === comment,
    )
  ) {
    return true
  }

  return false
}
