import {createRequire} from 'node:module'

import {type NodePath, type TransformOptions, traverse} from '@babel/core'
import {type Scope} from '@babel/traverse'
import * as babelTypes from '@babel/types'

import {getBabelConfig} from '../getBabelConfig'
import {resolveExpression} from './expressionResolvers'
import {parseSourceFile} from './parseSource'
import {
  type ExtractedDocumentProjection,
  type ExtractedModule,
  type ExtractedQuery,
  QueryExtractionError,
} from './types'

const require = createRequire(__filename)

const groqTagName = 'groq'
const defineQueryFunctionName = 'defineQuery'
const defineDocumentProjectionFunctionName = 'defineDocumentProjection'
const groqModuleName = 'groq'
const nextSanityModuleName = 'next-sanity'

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
): ExtractedModule {
  const queries: ExtractedQuery[] = []
  const documentProjections: ExtractedDocumentProjection[] = []
  const errors: QueryExtractionError[] = []
  const file = parseSourceFile(source, filename, babelConfig)

  traverse(file, {
    // Look for variable declarations, e.g. `const myQuery = groq`... and extract the query.
    // The variable name is used as the name of the query result type
    VariableDeclarator(path) {
      const {node, scope} = path

      const init = node.init

      // Look for tagged template expressions that are called with the `groq` tag
      const isGroqTemplateTag =
        babelTypes.isTaggedTemplateExpression(init) &&
        babelTypes.isIdentifier(init.tag) &&
        init.tag.name === groqTagName

      if (!babelTypes.isIdentifier(node.id)) return
      // If we find a comment leading the declaration which matches with
      // ignoreValue we don't add the query
      if (declarationLeadingCommentContains(path, ignoreValue)) return

      const {id, start, end} = node
      const variable = {id, ...(start && {start}), ...(end && {end})}

      if (isGroqTemplateTag || isDefineQueryCall(init, scope)) {
        try {
          const query = resolveExpression({
            node: init,
            file,
            scope,
            babelConfig,
            filename,
            resolver,
          })
          queries.push({variable, query, filename})
        } catch (cause) {
          errors.push(new QueryExtractionError({type: 'query', filename, variable, cause}))
        }
      }

      if (isDefineDocumentProjectionCall(init, scope)) {
        const [documentTypeArgument, projectionExpression] = init.arguments

        const documentTypeExpressions = babelTypes.isArrayExpression(documentTypeArgument)
          ? documentTypeArgument.elements
          : [documentTypeArgument]

        try {
          const documentTypes = documentTypeExpressions
            .filter((expression) => !!expression)
            .map((expression) =>
              resolveExpression({
                node: expression,
                file,
                scope,
                babelConfig,
                filename,
                resolver,
              }),
            )

          const projection = resolveExpression({
            node: projectionExpression,
            file,
            scope,
            babelConfig,
            filename,
            resolver,
          })

          documentProjections.push({variable, documentTypes, projection, filename})
        } catch (cause) {
          errors.push(
            new QueryExtractionError({type: 'documentProjection', filename, variable, cause}),
          )
        }
      }
    },
  })

  return {filename, queries, documentProjections, errors}
}

function isDefineQueryCall(
  init: babelTypes.Expression | null | undefined,
  scope: Scope,
): init is babelTypes.CallExpression {
  if (!init) return false
  if (!babelTypes.isCallExpression(init)) return false
  return !!(
    isImportFrom(groqModuleName, defineQueryFunctionName, scope, init.callee) ||
    isImportFrom(nextSanityModuleName, defineQueryFunctionName, scope, init.callee)
  )
}

function isDefineDocumentProjectionCall(
  init: babelTypes.Expression | null | undefined,
  scope: Scope,
): init is babelTypes.CallExpression {
  if (!init) return false
  if (!babelTypes.isCallExpression(init)) return false
  if (!isImportFrom(groqModuleName, defineDocumentProjectionFunctionName, scope, init.callee))
    return false
  return init.arguments.length === 2
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

function isImportFrom(
  moduleName: string,
  importName: string,
  scope: Scope,
  node: babelTypes.Expression | babelTypes.V8IntrinsicIdentifier,
) {
  if (babelTypes.isIdentifier(node)) {
    const binding = scope.getBinding(node.name)
    if (!binding) {
      return false
    }

    const {path} = binding

    // import { foo } from 'groq'
    if (babelTypes.isImportSpecifier(path.node)) {
      return (
        path.node.importKind === 'value' &&
        path.parentPath &&
        babelTypes.isImportDeclaration(path.parentPath.node) &&
        path.parentPath.node.source.value === moduleName &&
        babelTypes.isIdentifier(path.node.imported) &&
        path.node.imported.name === importName
      )
    }

    // const { defineQuery } = require('groq')
    if (babelTypes.isVariableDeclarator(path.node)) {
      const {init} = path.node
      return (
        babelTypes.isCallExpression(init) &&
        babelTypes.isIdentifier(init.callee) &&
        init.callee.name === 'require' &&
        babelTypes.isStringLiteral(init.arguments[0]) &&
        init.arguments[0].value === moduleName
      )
    }
  }

  // import * as foo from 'groq'
  // foo.defineQuery(...)
  if (babelTypes.isMemberExpression(node)) {
    const {object, property} = node

    if (!babelTypes.isIdentifier(object)) {
      return false
    }

    const binding = scope.getBinding(object.name)
    if (!binding) {
      return false
    }
    const {path} = binding

    return (
      babelTypes.isIdentifier(object) &&
      babelTypes.isIdentifier(property) &&
      property.name === importName &&
      babelTypes.isImportNamespaceSpecifier(path.node) &&
      path.parentPath &&
      babelTypes.isImportDeclaration(path.parentPath.node) &&
      path.parentPath.node.source.value === moduleName
    )
  }

  return false
}
