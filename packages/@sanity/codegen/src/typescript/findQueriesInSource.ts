import {createRequire} from 'node:module'
import {join} from 'node:path'

import {type TransformOptions, traverse} from '@babel/core'
import * as babelTypes from '@babel/types'

import {type NamedQueryResult, resolveExpression} from './expressionResolvers'
import {parseSourceFile} from './parseSource'

const require = createRequire(__filename)

const groqTagName = 'groq'

const defaultBabelOptions = {
  extends: join(__dirname, '..', '..', 'babel.config.json'),
}

export function findQueriesInSource(
  source: string,
  filename: string,
  babelConfig: TransformOptions = defaultBabelOptions,
  resolver: NodeJS.RequireResolve = require.resolve,
): Map<string, NamedQueryResult> {
  const queries = new Map<string, NamedQueryResult>()
  const file = parseSourceFile(source, filename, babelConfig)

  traverse(file, {
    VariableDeclarator({node, scope}) {
      const init = node.init
      if (
        babelTypes.isTaggedTemplateExpression(init) &&
        babelTypes.isIdentifier(init.tag) &&
        babelTypes.isIdentifier(node.id) &&
        init.tag.name === groqTagName
      ) {
        const queryName = node.id.name
        const queryResult = resolveExpression({
          node: init,
          file,
          scope,
          babelConfig,
          filename,
          resolver,
        })
        queries.set(queryName, {name: queryName, result: queryResult})
      }
    },
  })

  return queries
}
