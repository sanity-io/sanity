import fs from 'node:fs'
import path from 'node:path'

import {type TransformOptions} from '@babel/core'
import traverse, {type Scope} from '@babel/traverse'
import * as babelTypes from '@babel/types'
import debug from 'debug'

import {parseSourceFile} from './parseSource'

const $debug = debug('sanity:codegen:findQueries:debug')

type resolveExpressionReturnType = string

export interface NamedQueryResult {
  name: string
  result: resolveExpressionReturnType
}

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
  $debug(
    `Resolving node ${node.type} in ${filename}:${node.loc?.start.line}:${node.loc?.start.column}`,
  )
  if (babelTypes.isTaggedTemplateExpression(node)) {
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
    if (!node.init) {
      throw new Error(`Unsupported variable declarator`)
    }

    return resolveExpression({
      node: node.init,
      fnArguments,
      scope,
      filename,
      file,
      babelConfig,
      resolver,
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

  if (babelTypes.isArrowFunctionExpression(node)) {
    return resolveExpression({
      node: node.body,
      params: node.params,
      fnArguments,
      scope,
      filename,
      file,
      babelConfig,
      resolver,
    })
  }

  if (babelTypes.isFunctionDeclaration(node)) {
    return resolveExpression({
      node: node.body,
      params: node.params,
      fnArguments,
      scope,
      filename,
      file,
      babelConfig,
      resolver,
    })
  }

  if (babelTypes.isFunctionExpression(node)) {
    return resolveExpression({
      node: node.body,
      scope,
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

  if (babelTypes.isBlockStatement(node)) {
    return resolveExpression({
      node: node.body[0],
      params,
      fnArguments,
      scope,
      filename,
      file,
      babelConfig,
      resolver,
    })
  }

  if (babelTypes.isReturnStatement(node)) {
    if (!node.argument) {
      throw new Error(`Unsupported return statement`)
    }
    return resolveExpression({
      node: node.argument,
      params,
      fnArguments,
      scope,
      filename,
      file,
      babelConfig,
      resolver,
    })
  }

  if (babelTypes.isImportDefaultSpecifier(node) || babelTypes.isImportSpecifier(node)) {
    return resolveImportSpecifier({node, file, scope, filename, resolver, babelConfig})
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
  const argument = fnArguments[paramIndex]
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
  const defaultParam = params[paramIndex]

  if (
    defaultParam &&
    babelTypes.isAssignmentExpression(defaultParam) &&
    babelTypes.isIdentifier(defaultParam.right)
  ) {
    return resolveExpression({
      node: defaultParam.right,
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

function resolveClass({
  node,
  property,
  scope,
  filename,
  babelConfig,
  file,
  resolver,
}: {
  node: babelTypes.ClassDeclaration
  property: babelTypes.Identifier
  file: babelTypes.File
  scope: Scope
  filename: string
  resolver: NodeJS.RequireResolve
  babelConfig: TransformOptions
  fnArguments?: babelTypes.Node[]
  params?: babelTypes.Node[]
}): resolveExpressionReturnType {
  if (!babelTypes.isClassDeclaration(node)) {
    throw new Error(`Could not find class declaration for class binding`)
  }
  const classBody = node.body
  const classMethod = classBody.body.find((body) => {
    if (!babelTypes.isClassMethod(body)) {
      return null
    }
    if (!babelTypes.isIdentifier(body.key)) {
      return null
    }
    return body.key.name === property.name
  }) as babelTypes.ClassMethod | undefined
  if (!classMethod) {
    throw new Error(`Could not find class method ${property.name}`)
  }
  return resolveExpression({
    node: classMethod.body,
    scope,
    filename,
    file,
    babelConfig,
    resolver,
  })
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

  if (babelTypes.isMemberExpression(callee)) {
    const {object, property} = callee

    if (babelTypes.isIdentifier(object) && babelTypes.isIdentifier(property)) {
      const binding = scope.getBinding(object.name)
      if (binding && babelTypes.isClassDeclaration(binding.path.node)) {
        return resolveClass({
          node: binding.path.node,
          file,
          property,
          scope,
          filename,
          babelConfig,
          resolver,
          fnArguments: node.arguments,
          params,
        })
      }

      if (
        binding &&
        babelTypes.isVariableDeclarator(binding.path.node) &&
        babelTypes.isNewExpression(binding.path.node.init) &&
        babelTypes.isIdentifier(binding.path.node.init.callee)
      ) {
        const classBinding = scope.getBinding(binding.path.node.init.callee.name)
        if (classBinding && babelTypes.isClassDeclaration(classBinding.path.node)) {
          return resolveClass({
            node: classBinding.path.node,
            file,
            property,
            scope,
            filename,
            resolver,
            babelConfig,
            fnArguments: node.arguments,
            params,
          })
        }
      }
    }
    if (
      babelTypes.isNewExpression(object) &&
      babelTypes.isIdentifier(object.callee) &&
      babelTypes.isIdentifier(property)
    ) {
      const binding = scope.getBinding(object.callee.name)
      if (binding && babelTypes.isClassDeclaration(binding.path.node)) {
        return resolveClass({
          node: binding.path.node,
          file,
          property,
          scope,
          filename,
          resolver,
          babelConfig,
          fnArguments: node.arguments,
          params,
        })
      }
    }
    return resolveExpression({
      node: object,
      scope,
      filename,
      file,
      resolver,
      babelConfig,
      fnArguments: node.arguments,
      params,
    })
  }

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
  resolver,
  babelConfig,
}: {
  node: babelTypes.ImportDefaultSpecifier | babelTypes.ImportSpecifier | babelTypes.ExportSpecifier
  file: babelTypes.File
  scope: Scope
  filename: string
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

  const importName = node.local.name
  const importFileName = importDeclaration.source.value
  // const importPath = path.resolve(path.dirname(filename), importFileName);
  const importPath = importName.startsWith('./')
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
      babelConfig,
      filename: importFileName,
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
      resolver,
      babelConfig,
    })
  }

  throw new Error(`Could not find binding for import "${importName}" in ${importFileName}`)
}

function resolveExportSpecifier({
  node,
  importName,
  filename,
  babelConfig,
  resolver,
}: {
  node: babelTypes.ExportNamedDeclaration
  importName: string
  filename: string
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
    })
  }

  throw new Error(`Could not find binding for export "${importName}" in ${importFileName}`)
}
