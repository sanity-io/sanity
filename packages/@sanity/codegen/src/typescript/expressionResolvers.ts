import {type ModuleScope, Reference, type Scope, Variable} from 'eslint-scope'
import {
  type ArrowFunctionExpression,
  type BlockStatement,
  type CallExpression,
  type Expression,
  type FunctionDeclaration,
  type FunctionExpression,
  type Identifier,
  type Literal,
  type Node,
  type Program,
  type ReturnStatement,
  type Statement,
  type VariableDeclaration,
  type VariableDeclarator,
} from 'estree'

import {overrideProperty, type StableTuple, stableTuple, take} from './helpers'
import {getModuleScope} from './scope'
import {isDefineQueryCall, isSpecifierValuesEqual, t} from './types'

// TODO: de-dupe
const groqTagName = 'groq'

export interface ResolveExpressionContext {
  load: (moduleId: string) => Promise<Program>
  resolve: (source: string, importer: string) => Promise<string>
  start?: number
  timeout?: number
  visited?: {
    modules: Set<StableTuple<Node, Scope>>
    identifiers: Set<StableTuple<Node, Scope>>
  }
  extractableTagNames?: string[]
}

// TODO: consider adding metadata like filename, scope, parent identifiers, etc
export class ExpressionResolutionError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'ExpressionResolutionError'
  }
}

export class IdentifierNotFoundError extends ExpressionResolutionError {
  constructor(message?: string) {
    super(message)
    this.name = 'IdentifierNotFoundError'
  }
}

export interface ResolveExpressionOptions<TNode extends Node = Node, TScope extends Scope = Scope> {
  node: TNode
  filename: string
  scope: TScope
  context: ResolveExpressionContext
}

export async function resolveExpression({
  node,
  filename,
  scope,
  context: {
    visited = {identifiers: new Set(), modules: new Set()},
    start = Date.now(),
    timeout = 100,
    ...rest
  },
}: ResolveExpressionOptions): Promise<string> {
  if (start && timeout && Date.now() - start > timeout) {
    throw new ExpressionResolutionError(
      `Expression resolution timed out after ${timeout}ms. ` +
        'This could be due to a complex expression or an infinite loop.',
    )
  }

  const context = {visited, start, timeout, ...rest}
  if (t.isTaggedTemplateExpression(node)) {
    const extractableTagNames = new Set(context.extractableTagNames)
    extractableTagNames.add(groqTagName)

    if (!t.isIdentifier(node.tag)) {
      throw new ExpressionResolutionError(
        `Cannot resolve tagged template expression with complex tag. ` +
          `Only simple identifier tags are supported (e.g., 'groq\`*[_type == "author"]\`'), ` +
          'but found a complex expression.',
      )
    }

    if (!extractableTagNames.has(node.tag.name)) {
      const foundTag = node.tag.name
      throw new ExpressionResolutionError(
        `Cannot resolve tagged template with unsupported tag '${foundTag}'. ` +
          `Remove the tag or configure 'extractableTagNames' to include '${foundTag}'.`,
      )
    }

    return resolveExpression({
      node: node.quasi,
      scope,
      filename,
      context,
    })
  }

  if (t.isTemplateLiteral(node)) {
    const resolvedExpressions = await Promise.all(
      node.expressions.map((expr) => resolveExpression({node: expr, scope, filename, context})),
    )

    return node.quasis
      .map((quasi, i) => `${quasi.value.cooked ?? ''}${resolvedExpressions.at(i) ?? ''}`)
      .join('')
  }

  if (t.isLiteral(node)) {
    if (node.value instanceof RegExp) {
      throw new ExpressionResolutionError(
        `Cannot resolve RegExp literal ${node.raw}. ` +
          `Regular expressions are not supported in query expressions.`,
      )
    }
    return String(node.value)
  }

  if (t.isIdentifier(node)) {
    return resolveExpression(
      await resolveIdentifier({
        node,
        scope,
        filename,
        context: {
          ...context,
          visited: {
            identifiers: new Set(),
            modules: new Set(),
          },
        },
      }),
    )
  }

  if (t.isCallExpression(node)) {
    if (isDefineQueryCall(node, scope)) {
      return resolveExpression({
        node: node.arguments[0],
        scope,
        filename,
        context,
      })
    }

    return resolveExpression(
      await resolveCallExpression({
        node,
        scope,
        filename,
        context,
      }),
    )
  }

  throw new ExpressionResolutionError(
    `Cannot statically evaluate ${node.type} expression. ` +
      'Only template literals, identifiers, function calls, ' +
      'and simple literals are supported for query extraction.',
  )
}

async function resolveIdentifier({
  node,
  scope,
  filename,
  context,
}: ResolveExpressionOptions<Identifier>): Promise<ResolveExpressionOptions> {
  const nodeScope = stableTuple(node, scope)
  if (context.visited?.identifiers.has(nodeScope)) {
    throw new ExpressionResolutionError(
      `Circular reference detected while resolving identifier '${node.name}'.`,
    )
  }
  context.visited?.identifiers.add(nodeScope)

  const reference = scope.references.find((ref) => ref.identifier.name === node.name)
  const resolved = reference?.resolved
  const definition = resolved?.defs.at(0)

  if (!resolved || !definition) {
    throw new IdentifierNotFoundError(
      `Could not resolve identifier '${node.name}'. ` +
        "Ensure it's defined in the current scope or imported.",
    )
  }

  if (definition.type === 'Variable') {
    if (!t.isIdentifier(definition.node.id)) {
      throw new ExpressionResolutionError(
        'Only simple variable declarations are supported for query identifiers. ' +
          `Found ${definition.node.id.type} instead of an identifier. ` +
          'Destructuring is not supported.',
      )
    }
    const {init, id} = definition.node

    if (!init) {
      const variableName = id.name
      throw new ExpressionResolutionError(
        `Variable '${variableName}' was declared without an initializer. ` +
          'Queries must be assigned a value when declared.',
      )
    }

    if (t.isIdentifier(init)) {
      return resolveIdentifier({
        node: init,
        scope: resolved.scope,
        filename,
        context,
      })
    }

    return {
      node: init,
      scope: resolved.scope,
      filename,
      context,
    }
  }

  if (definition.type === 'ImportBinding') {
    const source = definition.parent.source.value as string
    const importedModuleId = await context.resolve(source, filename)
    const importedModule = await context.load(importedModuleId)
    const moduleScope = getModuleScope(importedModule)

    if (t.isImportSpecifier(definition.node)) {
      return resolveImportedIdentifier({
        node: definition.node.imported,
        scope: moduleScope,
        filename: importedModuleId,
        context,
      })
    }

    if (t.isImportDefaultSpecifier(definition.node)) {
      return resolveImportedIdentifier({
        node: {type: 'Identifier', name: 'default'},
        filename: importedModuleId,
        scope: moduleScope,
        context,
      })
    }

    throw new ExpressionResolutionError(
      'Namespace imports are not supported. ' +
        `Could not resolve '${node.name}' as it was imported as a namespace. ` +
        'Please use a named or default import instead.',
    )
  }

  if (definition.type === 'FunctionName') {
    return {
      node: definition.node,
      scope,
      filename,
      context,
    }
  }

  throw new ExpressionResolutionError(
    'Unable to resolve identifier. ' +
      `Identifier '${node.name}' resolved to a '${definition.type}', ` +
      'which is not supported for static query resolution. Only variables, ' +
      'imports, and function declarations are supported.',
  )
}

async function resolveImportedIdentifier({
  node,
  scope,
  filename,
  context,
}: ResolveExpressionOptions<Identifier | Literal, ModuleScope>): Promise<ResolveExpressionOptions> {
  const program = scope.block as Program
  const nodeScope = stableTuple(node, scope)
  if (context.visited?.modules.has(nodeScope)) {
    throw new IdentifierNotFoundError(
      'Circular dependency detected. ' +
        `Module '${filename}' has already been visited while resolving this identifier.`,
    )
  }
  context.visited?.modules.add(nodeScope)

  // Handle 'default' identifier: first check for export default declaration.
  // If no `export default` declaration is found, it's still possible to resolve
  // via named export declarations e.g. `export {default as local}`
  if (isSpecifierValuesEqual(node, {type: 'Identifier', name: 'default'})) {
    const exportDefaultDeclaration = program.body.find((i) => t.isExportDefaultDeclaration(i))

    if (exportDefaultDeclaration) {
      return {
        node: exportDefaultDeclaration.declaration as Node,
        scope,
        filename,
        context,
      }
    }
  }

  // try to resolve the variable at the module scope
  const resolved = scope.references.find(
    (ref) => t.isIdentifier(node) && node.name === ref.identifier.name,
  )?.resolved
  const definition = resolved?.defs.at(0)

  // Handle named export declarations e.g. `export {imported as local}`
  for (const exported of program.body) {
    if (!t.isExportNamedDeclaration(exported)) continue

    for (const specifier of exported.specifiers) {
      if (!isSpecifierValuesEqual(node, specifier.exported)) continue

      if (exported.source) {
        const sourceId = await context.resolve(exported.source.value as string, filename)

        return resolveImportedIdentifier({
          node: specifier.local,
          filename: sourceId,
          scope: getModuleScope(await context.load(sourceId)),
          context,
        })
      }

      return resolveIdentifier({
        // string literals are not allowed as local bindings in javascript
        node: specifier.local as Identifier,
        filename,
        scope,
        context,
      })
    }

    if (
      resolved &&
      definition &&
      exported.declaration === definition.parent &&
      t.isIdentifier(node)
    ) {
      return resolveIdentifier({
        node,
        scope: resolved.scope,
        filename,
        context,
      })
    }
  }

  // check for re-exports
  for (const declaration of program.body) {
    if (!t.isExportAllDeclaration(declaration)) continue
    // note: `export * as ns from 'source'` is not supported
    if (declaration.exported) continue

    try {
      const candidateId = await context.resolve(declaration.source.value as string, filename)
      return await resolveImportedIdentifier({
        node,
        scope: getModuleScope(await context.load(candidateId)),
        filename: candidateId,
        context,
      })
    } catch (e) {
      if (e instanceof IdentifierNotFoundError) continue
      throw e
    }
  }

  throw new IdentifierNotFoundError(
    `Could not find exported name '${t.isIdentifier(node) ? node.name : node.value}' from ${filename}`,
  )
}

async function resolveFunctionExpression({
  node,
  scope,
  filename,
  context,
}: ResolveExpressionOptions): Promise<
  ResolveExpressionOptions<FunctionDeclaration | FunctionExpression | ArrowFunctionExpression>
> {
  if (
    t.isFunctionDeclaration(node) ||
    t.isFunctionExpression(node) ||
    t.isArrowFunctionExpression(node)
  ) {
    return {
      node,
      scope: scope.childScopes.find((child) => child.block === node) ?? scope,
      filename,
      context,
    }
  }

  if (t.isIdentifier(node)) {
    return resolveFunctionExpression(
      await resolveIdentifier({
        node,
        scope,
        filename,
        context: {
          ...context,
          visited: {
            identifiers: new Set(),
            modules: new Set(),
          },
        },
      }),
    )
  }

  if (t.isCallExpression(node)) {
    return resolveFunctionExpression(await resolveCallExpression({node, scope, filename, context}))
  }

  throw new ExpressionResolutionError(
    `Cannot statically evaluate ${node.type} expression. ` +
      'Query extraction requires expressions that can be statically evaluated, ' +
      `but ${node.type} is not supported.`,
  )
}

function* resolveReturnStatements({
  node,
  filename,
  context,
  ...options
}: ResolveExpressionOptions<Statement>): Generator<ResolveExpressionOptions<ReturnStatement>> {
  const scope = options.scope.childScopes.find((s) => s.block === node) ?? options.scope

  if (t.isReturnStatement(node)) {
    yield {node, scope, filename, context}
    return
  }

  // skip declarations
  if (
    t.isFunctionDeclaration(node) ||
    t.isClassDeclaration(node) ||
    t.isVariableDeclaration(node)
  ) {
    return
  }

  if (t.isIfStatement(node)) {
    yield* resolveReturnStatements({node: node.consequent, scope, filename, context})
    if (node.alternate) {
      yield* resolveReturnStatements({node: node.consequent, scope, filename, context})
    }
    return
  }

  if (t.isTryStatement(node)) {
    yield* resolveReturnStatements({node: node.block, scope, filename, context})
    return
  }

  if ('body' in node) {
    const statements = Array.isArray(node.body) ? node.body : [node.body]
    for (const statement of statements) {
      yield* resolveReturnStatements({node: statement, scope, filename, context})
    }
  }
}

async function resolveCallExpression({
  node: callExpression,
  context,
  ...options
}: ResolveExpressionOptions<CallExpression>): Promise<ResolveExpressionOptions> {
  const {
    node: functionExpression,
    scope,
    filename,
  } = await resolveFunctionExpression({
    node: callExpression.callee,
    context,
    ...options,
  })

  if (functionExpression.async) {
    throw new ExpressionResolutionError(
      'Async functions are not supported as their Promise return value cannot be statically evaluated.',
    )
  }

  if (functionExpression.generator) {
    throw new ExpressionResolutionError(
      'Generator functions are not supported as their yielded values cannot be statically evaluated.',
    )
  }

  const references = new Map<string, Reference>(
    scope.references.map((reference) => [reference.identifier.name, reference]),
  )

  const maxLength = Math.max(callExpression.arguments.length, functionExpression.params.length)
  for (let i = 0; i < maxLength; i++) {
    const param = functionExpression.params.at(i)
    const arg = callExpression.arguments.at(i)

    const paramId = t.isAssignmentPattern(param) ? param.left : param
    const paramInit = t.isAssignmentPattern(param) && param.right
    if (!t.isIdentifier(paramId)) {
      throw new ExpressionResolutionError(
        `Unsupported parameter type '${param?.type}'. ` +
          'Only identifiers and assignment patterns are supported ' +
          'in function parameters for static query resolution.',
      )
    }
    if (t.isSpreadElement(arg)) {
      throw new ExpressionResolutionError('Spread arguments are not supported in function calls.')
    }

    const init = t.isIdentifier(arg) && arg.name === 'undefined' ? paramInit : (arg ?? paramInit)
    if (!init) {
      throw new ExpressionResolutionError(`No value provided for parameter '${paramId.name}'.`)
    }

    const variable = new Variable(paramId.name, scope)
    const variableDeclarator: VariableDeclarator = {
      type: 'VariableDeclarator',
      id: paramId,
      init,
    }
    const variableDeclaration: VariableDeclaration = {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [variableDeclarator],
    }

    variable.defs = [
      {
        type: 'Variable',
        name: paramId,
        node: variableDeclarator,
        parent: variableDeclaration,
      },
    ]

    const reference = overrideProperty(
      new Reference(paramId, options.scope, 0, null, false, false, false),
      'resolved',
      variable,
    )

    references.set(paramId.name, reference)
  }

  const appliedScope = overrideProperty(scope, 'references', Array.from(references.values()))

  // Create a shallow copy of the function body to avoid eslint-scope's memoization.
  // eslint-scope caches scope analysis results based on AST node object identity,
  // so we need a new object reference to ensure fresh scope analysis with our modified parameters.
  const body: Expression | BlockStatement = {...functionExpression.body}

  if (t.isBlockStatement(body)) {
    let returnStatements
    returnStatements = resolveReturnStatements({
      node: body,
      scope: appliedScope,
      filename,
      context,
    })
    returnStatements = take(returnStatements, 2)
    returnStatements = Array.from(returnStatements)

    if (!returnStatements.length) {
      throw new ExpressionResolutionError(
        'Function must have a return statement to be statically evaluated.',
      )
    }
    if (returnStatements.length > 1) {
      throw new ExpressionResolutionError(
        `Function must have exactly one return statement to be statically evaluated, ` +
          `but found ${returnStatements.length}.`,
      )
    }
    const [returnStatement] = returnStatements
    const {argument} = returnStatement.node
    if (!argument) {
      throw new ExpressionResolutionError(
        'Return statement must return a value to be statically evaluated.',
      )
    }
    return {...returnStatement, node: argument}
  }

  return {
    node: body,
    scope: appliedScope,
    filename,
    context,
  }
}
