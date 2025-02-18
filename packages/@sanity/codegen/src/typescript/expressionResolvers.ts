import fs from 'node:fs'
import path from 'node:path'

import {type TransformOptions} from '@babel/core'
import traverse, {Scope} from '@babel/traverse'
import * as babelTypes from '@babel/types'
import createDebug from 'debug'

import {parseSourceFile} from './parseSource'

const debug = createDebug('sanity:codegen:findQueries:debug')

type resolveExpressionReturnType = string

/**
 * NamedQueryResult is a result of a named query
 */
export interface NamedQueryResult {
  /** name is the name of the query */
  name: string
  /** result is a groq query */
  result: resolveExpressionReturnType

  /** location is the location of the query in the source */
  location: {
    start?: {
      line: number
      column: number
      index: number
    }
    end?: {
      line: number
      column: number
      index: number
    }
  }
}

const TAGGED_TEMPLATE_ALLOW_LIST = ['groq']
const FUNCTION_WRAPPER_ALLOW_LIST = ['defineQuery']

/**
 * resolveExpression takes a node and returns the resolved value of the expression.
 * @beta
 * @internal
 */
export function resolveExpression({
  node,
  file,
  scope,
  filename,
  resolver,
  babelConfig,
  params = [],
  fnArguments = [],
}: {
  node: babelTypes.Node
  file: babelTypes.File
  scope: Scope
  filename: string
  resolver: NodeJS.RequireResolve
  babelConfig: TransformOptions
  params?: babelTypes.Node[]
  fnArguments?: babelTypes.Node[]
}): resolveExpressionReturnType {
  debug(
    `Resolving node ${node.type} in ${filename}:${node.loc?.start.line}:${node.loc?.start.column}`,
  )
  if (
    babelTypes.isTaggedTemplateExpression(node) &&
    babelTypes.isIdentifier(node.tag) &&
    TAGGED_TEMPLATE_ALLOW_LIST.includes(node.tag.name)
  ) {
    return resolveExpression({
      node: node.quasi,
      scope,
      filename,
      file,
      resolver,
      params,
      babelConfig,
      fnArguments,
    })
  }

  if (babelTypes.isTemplateLiteral(node)) {
    const resolvedExpressions = node.expressions.map((expression) =>
      resolveExpression({
        node: expression,
        scope,
        filename,
        file,
        resolver,
        params,
        babelConfig,
        fnArguments,
      }),
    )
    return node.quasis
      .map((quasi, idx) => {
        return (quasi.value.cooked || '') + (resolvedExpressions[idx] || '')
      })
      .join('')
  }

  if (babelTypes.isLiteral(node)) {
    if (node.type === 'NullLiteral' || node.type === 'RegExpLiteral') {
      throw new Error(`Unsupported literal type: ${node.type}`)
    }

    return node.value.toString()
  }

  if (babelTypes.isIdentifier(node)) {
    return resolveIdentifier({
      node,
      scope,
      filename,
      file,
      resolver,
      fnArguments,
      babelConfig,
      params,
    })
  }

  if (babelTypes.isVariableDeclarator(node)) {
    const init = node.init ?? (babelTypes.isAssignmentPattern(node.id) && node.id.right)
    if (!init) {
      throw new Error(`Unsupported variable declarator`)
    }

    return resolveExpression({
      node: init,
      fnArguments,
      scope,
      filename,
      file,
      babelConfig,
      resolver,
    })
  }

  if (
    babelTypes.isCallExpression(node) &&
    babelTypes.isIdentifier(node.callee) &&
    FUNCTION_WRAPPER_ALLOW_LIST.includes(node.callee.name)
  ) {
    return resolveExpression({
      node: node.arguments[0],
      scope,
      filename,
      file,
      resolver,
      babelConfig,
      params,
    })
  }

  if (babelTypes.isCallExpression(node)) {
    return resolveCallExpression({
      node,
      scope,
      filename,
      file,
      resolver,
      babelConfig,
      params,
      fnArguments,
    })
  }

  if (
    babelTypes.isArrowFunctionExpression(node) ||
    babelTypes.isFunctionDeclaration(node) ||
    babelTypes.isFunctionExpression(node)
  ) {
    const newScope = new Scope(scope.path, scope)

    params.forEach((param, i) => {
      newScope.push({
        id: param as babelTypes.LVal,
        init: fnArguments[i] as babelTypes.Expression | undefined,
      })
    })

    return resolveExpression({
      node: node.body,
      params: node.params,
      fnArguments,
      scope: newScope,
      filename,
      file,
      babelConfig,
      resolver,
    })
  }

  if (babelTypes.isNewExpression(node)) {
    return resolveExpression({
      node: node.callee,
      scope,
      filename,
      file,
      babelConfig,
      resolver,
    })
  }

  if (babelTypes.isImportDefaultSpecifier(node) || babelTypes.isImportSpecifier(node)) {
    return resolveImportSpecifier({node, file, scope, filename, fnArguments, resolver, babelConfig})
  }

  if (babelTypes.isAssignmentPattern(node)) {
    return resolveExpression({
      node: node.right,
      scope,
      filename,
      file,
      resolver,
      params,
      babelConfig,
      fnArguments,
    })
  }

  throw new Error(
    `Unsupported expression type: ${node.type} in ${filename}:${node.loc?.start.line}:${node.loc?.start.column}`,
  )
}

function resolveIdentifier({
  node,
  scope,
  filename,
  file,
  resolver,
  babelConfig,
  fnArguments,
  params,
}: {
  node: babelTypes.Identifier
  file: babelTypes.File
  scope: Scope
  filename: string
  resolver: NodeJS.RequireResolve
  babelConfig: TransformOptions
  fnArguments: babelTypes.Node[]
  params: babelTypes.Node[]
}): resolveExpressionReturnType {
  const paramIndex = params.findIndex(
    (param) =>
      (babelTypes.isIdentifier(param) && node.name === param.name) ||
      (babelTypes.isAssignmentPattern(param) &&
        babelTypes.isIdentifier(param.left) &&
        node.name === param.left.name),
  )
  let argument = fnArguments[paramIndex]
  if (!argument && paramIndex >= 0 && babelTypes.isAssignmentPattern(params[paramIndex])) {
    argument = params[paramIndex].right
  }
  if (argument && babelTypes.isLiteral(argument)) {
    return resolveExpression({
      node: argument,
      scope,
      filename,
      file,
      resolver,
      params,
      babelConfig,
      fnArguments,
    })
  }
  const binding = scope.getBinding(node.name)
  if (binding) {
    if (babelTypes.isIdentifier(binding.path.node)) {
      const isSame = binding.path.node.name === node.name
      if (isSame) {
        throw new Error(
          `Could not resolve same identifier "${node.name}" in "${filename}:${node.loc?.start.line}:${node.loc?.start.column}"`,
        )
      }
    }
    return resolveExpression({
      node: binding.path.node,
      params,
      fnArguments,
      scope,
      filename,
      babelConfig,
      file,
      resolver,
    })
  }

  throw new Error(
    `Could not find binding for node "${node.name}" in ${filename}:${node.loc?.start.line}:${node.loc?.start.column}`,
  )
}

function resolveCallExpression({
  node,
  scope,
  filename,
  file,
  resolver,
  babelConfig,
  params,
}: {
  node: babelTypes.CallExpression
  file: babelTypes.File
  scope: Scope
  filename: string
  resolver: NodeJS.RequireResolve
  babelConfig: TransformOptions
  fnArguments: babelTypes.Node[]
  params: babelTypes.Node[]
}): resolveExpressionReturnType {
  const {callee} = node
  return resolveExpression({
    node: callee,
    scope,
    filename,
    file,
    resolver,
    babelConfig,
    params,
    fnArguments: node.arguments,
  })
}

function resolveImportSpecifier({
  node,
  file,
  filename,
  fnArguments,
  resolver,
  babelConfig,
}: {
  node: babelTypes.ImportDefaultSpecifier | babelTypes.ImportSpecifier | babelTypes.ExportSpecifier
  file: babelTypes.File
  scope: Scope
  filename: string
  fnArguments: babelTypes.Node[]
  resolver: NodeJS.RequireResolve
  babelConfig: TransformOptions
}): resolveExpressionReturnType {
  let importDeclaration: babelTypes.ImportDeclaration | undefined
  traverse(file, {
    ImportDeclaration(n) {
      if (!babelTypes.isImportDeclaration(n.node)) {
        return
      }
      for (const specifier of n.node.specifiers) {
        if (babelTypes.isImportDefaultSpecifier(specifier)) {
          if (specifier.local.loc?.identifierName === node.local.name) {
            importDeclaration = n.node
            break
          }
        }
        if (specifier.local.name === node.local.name) {
          importDeclaration = n.node
        }
      }
    },
  })

  if (!importDeclaration) {
    throw new Error(`Could not find import declaration for ${node.local.name}`)
  }

  const importName = node.local.name // the name of the variable to import
  const importFileName = importDeclaration.source.value // the file to import from

  const importPath =
    importFileName.startsWith('./') || importFileName.startsWith('../')
      ? path.resolve(path.dirname(filename), importFileName)
      : importFileName

  const resolvedFile = resolver(importPath)
  const source = fs.readFileSync(resolvedFile)
  const tree = parseSourceFile(source.toString(), resolvedFile, babelConfig)

  let newScope: Scope | undefined
  traverse(tree, {
    Program(p) {
      newScope = p.scope
    },
  })
  if (!newScope) {
    throw new Error(`Could not find scope for ${filename}`)
  }

  const binding = newScope.getBinding(importName)
  if (binding) {
    return resolveExpression({
      node: binding.path.node,
      file: tree,
      scope: newScope,
      fnArguments,
      babelConfig,
      filename: resolvedFile,
      resolver,
    })
  }

  // It's not a global binding, but it might be a named export
  let namedExport: babelTypes.ExportNamedDeclaration | undefined
  let newImportName: string | undefined
  traverse(tree, {
    ExportDeclaration(p) {
      if (p.node.type === 'ExportNamedDeclaration') {
        for (const specifier of p.node.specifiers) {
          if (
            specifier.type === 'ExportSpecifier' &&
            specifier.exported.type === 'Identifier' &&
            specifier.exported.name === importName
          ) {
            namedExport = p.node
            newImportName = specifier.exported.name
          }
        }
      }
    },
  })

  if (namedExport && newImportName) {
    return resolveExportSpecifier({
      node: namedExport,
      importName: newImportName,
      filename: resolvedFile,
      fnArguments,
      resolver,
      babelConfig,
    })
  }

  let result: resolveExpressionReturnType | undefined
  traverse(tree, {
    ExportDeclaration(p) {
      if (p.node.type === 'ExportAllDeclaration') {
        try {
          result = resolveExportSpecifier({
            node: p.node,
            importName,
            filename: resolvedFile,
            fnArguments,
            resolver,
            babelConfig,
          })
        } catch (e) {
          if (e.cause !== `noBinding:${importName}`) throw e
        }
      }
    },
  })
  if (result) return result

  throw new Error(`Could not find binding for import "${importName}" in ${importFileName}`)
}

function resolveExportSpecifier({
  node,
  importName,
  filename,
  fnArguments,
  babelConfig,
  resolver,
}: {
  node: babelTypes.ExportNamedDeclaration | babelTypes.ExportAllDeclaration
  importName: string
  filename: string
  fnArguments: babelTypes.Node[]
  babelConfig: TransformOptions
  resolver: NodeJS.RequireResolve
}): resolveExpressionReturnType {
  if (!node.source) {
    throw new Error(`Could not find source for export "${importName}" in ${filename}`)
  }

  const importFileName = node.source.value
  const importPath = path.resolve(path.dirname(filename), importFileName)
  const resolvedFile = resolver(importPath)
  const source = fs.readFileSync(resolvedFile)
  const tree = parseSourceFile(source.toString(), resolvedFile, babelConfig)

  let newScope: Scope | undefined
  traverse(tree, {
    Program(p) {
      newScope = p.scope
    },
  })
  if (!newScope) {
    throw new Error(`Could not find scope for ${filename}`)
  }

  const binding = newScope.getBinding(importName)
  if (binding) {
    return resolveExpression({
      node: binding.path.node,
      file: tree,
      scope: newScope,
      filename: importFileName,
      babelConfig,
      resolver,
      fnArguments,
    })
  }

  throw new Error(`Could not find binding for export "${importName}" in ${importFileName}`, {
    cause: `noBinding:${importName}`,
  })
}
