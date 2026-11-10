import {declareValuePlugin, PluginKind} from '@stryker-mutator/api/plugin'
import {type babel} from '@stryker-mutator/instrumenter'

type AstNode = babel.NodePath['node']

const ERROR_CLASS_NAME = /^([A-Z]\w*)?Error$/

function errorClassNameOf(callee: AstNode): string | undefined {
  if (callee.type === 'Identifier') return callee.name
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    return callee.computed ? undefined : callee.property.name
  }
  return undefined
}

function isErrorCallee(callee: AstNode): boolean {
  const name = errorClassNameOf(callee)
  return name !== undefined && ERROR_CLASS_NAME.test(name)
}

function isLoggerCallee(callee: AstNode): boolean {
  if (callee.type === 'Identifier') return callee.name === 'debug'
  return (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'console'
  )
}

function isLoggerCall(node: AstNode): boolean {
  return node.type === 'CallExpression' && isLoggerCallee(node.callee)
}

function isErrorMessageArgument(path: babel.NodePath): boolean {
  const {parent} = path
  const isConstruction = parent.type === 'NewExpression' || parent.type === 'CallExpression'
  return (
    isConstruction && path.listKey === 'arguments' && path.key === 0 && isErrorCallee(parent.callee)
  )
}

/** Only the message of an error and logging calls, which change no behaviour when removed. */
export const messageIgnorer = {
  shouldIgnore(path: babel.NodePath): string | undefined {
    if (isErrorMessageArgument(path)) return 'Error message text'
    if (isLoggerCall(path.node)) return 'Log call'
    const isLogStatement =
      path.node.type === 'ExpressionStatement' && isLoggerCall(path.node.expression)
    return isLogStatement ? 'Log call' : undefined
  },
}

export const MESSAGE_IGNORER_NAME = 'engine-confidence-messages'

export const strykerPlugins = [
  declareValuePlugin(PluginKind.Ignore, MESSAGE_IGNORER_NAME, messageIgnorer),
]
