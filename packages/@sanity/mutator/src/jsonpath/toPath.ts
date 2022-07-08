import type {Expr} from './types'

/**
 * Converts a parsed expression back into jsonpath2, roughly -
 * mostly for use with tests.
 *
 * @param expr - Expression to convert to path
 * @returns a string representation of the path
 * @internal
 */
export function toPath(expr: Expr): string {
  return toPathInner(expr, false)
}

function toPathInner(expr: Expr, inUnion: boolean): string {
  switch (expr.type) {
    case 'attribute':
      return expr.name
    case 'alias':
      return expr.target === 'self' ? '@' : '$'
    case 'number':
      return `${expr.value}`
    case 'range': {
      const result = []
      if (!inUnion) {
        result.push('[')
      }
      if (expr.start) {
        result.push(`${expr.start}`)
      }
      result.push(':')
      if (expr.end) {
        result.push(`${expr.end}`)
      }
      if (expr.step) {
        result.push(`:${expr.step}`)
      }
      if (!inUnion) {
        result.push(']')
      }
      return result.join('')
    }
    case 'index':
      if (inUnion) {
        return `${expr.value}`
      }

      return `[${expr.value}]`
    case 'constraint': {
      const rhs = expr.rhs ? ` ${toPathInner(expr.rhs, false)}` : ''
      const inner = `${toPathInner(expr.lhs, false)} ${expr.operator}${rhs}`

      if (inUnion) {
        return inner
      }

      return `[${inner}]`
    }
    case 'string':
      return JSON.stringify(expr.value)
    case 'path': {
      const result = []
      const nodes = expr.nodes.slice()
      while (nodes.length > 0) {
        const node = nodes.shift()
        if (node) {
          result.push(toPath(node))
        }

        const upcoming = nodes[0]
        if (upcoming && toPathInner(upcoming, false)[0] !== '[') {
          result.push('.')
        }
      }
      return result.join('')
    }
    case 'union':
      return `[${expr.nodes.map((e) => toPathInner(e, true)).join(',')}]`
    default:
      throw new Error(`Unknown node type ${expr.type}`)
    case 'recursive':
      return `..${toPathInner(expr.term, false)}`
  }
}
