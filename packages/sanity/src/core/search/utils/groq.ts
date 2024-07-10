import {type ExprNode} from 'groq-js'

/**
 * Check whether the provided GROQ expression contains any unsupported operations at any level.
 *
 * The Text Search API doesn't support:
 *
 * - Subqueries & dereferences
 * - Function calls
 */
export function groqExpressionIsTextSearchCompatible(expression: ExprNode): boolean {
  return !groqExpressionContainsType(expression, ['Deref', 'Everything', 'FuncCall'])
}

/**
 * Check whether any of the provided GROQ expression types appear within the provided GROQ
 * expression at any level.
 */
export function groqExpressionContainsType(
  expression: ExprNode,
  type: ExprNode['type'][],
): boolean {
  if (type.includes(expression.type)) {
    return true
  }

  return Object.values(expression).some((value) => {
    if (Array.isArray(value)) {
      return value
        .filter(isGroqExpressionNode)
        .some((entry) => groqExpressionContainsType(entry, type))
    }

    if (isGroqExpressionNode(value)) {
      return groqExpressionContainsType(value, type)
    }

    return false
  })
}

/**
 * Check whether a value appears to be a GROQ expression node.
 *
 * Note: This simply verifies the value is an object with a `type` property. It does not check
 * whether the type—nor the rest of the object—is valid.
 */
export function isGroqExpressionNode(
  maybeGroqExpressionNode: unknown,
): maybeGroqExpressionNode is ExprNode {
  return (
    typeof maybeGroqExpressionNode === 'object' &&
    maybeGroqExpressionNode !== null &&
    'type' in maybeGroqExpressionNode
  )
}
