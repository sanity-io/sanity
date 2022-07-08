import type {Expr, PathExpr} from './types'

/**
 * Splits an expression into a set of heads, tails. A head is the next leaf node to
 * check for matches, and a tail is everything that follows it. Matching is done by
 * matching heads, then proceedint to the matching value, splitting the tail into
 * heads and tails and checking the heads against the new value, and so on.
 */
export function descend(tail: Expr): [Expr | null, PathExpr | null][] {
  const [head, newTail] = splitIfPath(tail)
  if (!head) {
    throw new Error('Head cannot be null')
  }

  return spreadIfUnionHead(head, newTail)
}

// Split path in [head, tail]
function splitIfPath(tail: Expr): [Expr | null, PathExpr | null] {
  if (tail.type !== 'path') {
    return [tail, null]
  }

  const nodes = tail.nodes
  if (nodes.length === 0) {
    return [null, null]
  }

  if (nodes.length === 1) {
    return [nodes[0], null]
  }

  return [nodes[0], {type: 'path', nodes: nodes.slice(1)}]
}

function concatPaths(path1: PathExpr | null, path2: PathExpr | null): PathExpr | null {
  if (!path1 && !path2) {
    return null
  }

  const nodes1 = path1 ? path1.nodes : []
  const nodes2 = path2 ? path2.nodes : []
  return {
    type: 'path',
    nodes: nodes1.concat(nodes2),
  }
}

// Spreads a union head into several heads/tails
function spreadIfUnionHead(head: Expr, tail: PathExpr | null): [Expr | null, PathExpr | null][] {
  if (head.type !== 'union') {
    return [[head, tail]]
  }

  return head.nodes.map((node) => {
    if (node.type === 'path') {
      const [subHead, subTail] = splitIfPath(node)
      return [subHead, concatPaths(subTail, tail)]
    }

    return [node, tail]
  })
}
