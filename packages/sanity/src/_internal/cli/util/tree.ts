import {isIndexSegment, isIndexTuple, isKeySegment, type Path} from '@sanity/types'

// FIXME: de-dupe this
// copy/paste of `pathToString` from 'sanity' to prevent circular imports
function pathToString(path: Path): string {
  if (!Array.isArray(path)) {
    throw new Error('Path is not an array')
  }

  return path.reduce<string>((target, segment, i) => {
    if (isIndexSegment(segment)) {
      return `${target}[${segment}]`
    }

    if (isKeySegment(segment) && segment._key) {
      return `${target}[_key=="${segment._key}"]`
    }

    if (isIndexTuple(segment)) {
      const [from, to] = segment
      return `${target}[${from}:${to}]`
    }

    if (typeof segment === 'string') {
      const separator = i === 0 ? '' : '.'
      return `${target}${separator}${segment}`
    }

    throw new Error(`Unsupported path segment \`${JSON.stringify(segment)}\``)
  }, '')
}

interface BaseNode {
  path: Path
}

export interface Tree<Node extends BaseNode> {
  nodes?: Node[]
  children?: Record<string, Tree<Node>>
}

/**
 * Recursively calculates the max length of all the keys in the given validation
 * tree respecting extra length due to indentation depth. Used to calculate the
 * padding for the rest of the tree.
 */
export const maxKeyLength = (children: Record<string, Tree<BaseNode>> = {}, depth = 0): number => {
  return Object.entries(children)
    .map(([key, child]) =>
      Math.max(key.length + depth * 2, maxKeyLength(child.children, depth + 1)),
    )
    .reduce((max, next) => (next > max ? next : max), 0)
}

interface Options<Node extends BaseNode> {
  node?: Record<string, Tree<Node>>
  paddingLength: number
  indent?: string
  getNodes?: (node: Tree<Node>) => Node[] | undefined
  getMessage: (node: Node) => string
}

/**
 * Recursively formats a given tree into a printed user-friendly tree structure
 */
export const formatTree = <Node extends BaseNode>({
  node = {},
  paddingLength,
  indent = '',
  getNodes: getLeaves = ({nodes}) => nodes,
  getMessage,
}: Options<Node>): string => {
  const entries = Object.entries(node)

  return entries
    .map(([key, child], index) => {
      const isLast = index === entries.length - 1
      const nextIndent = `${indent}${isLast ? '  ' : '│ '}`
      const leaves = getLeaves(child)

      const nested = formatTree({
        node: child.children,
        paddingLength,
        indent: nextIndent,
        getNodes: getLeaves,
        getMessage,
      })

      if (!leaves?.length) {
        const current = `${indent}${isLast ? '└' : '├'}─ ${key}`
        return [current, nested].filter(Boolean).join('\n')
      }

      const [first, ...rest] = leaves
      const firstPadding = '.'.repeat(paddingLength - indent.length - key.length)
      const elbow = isLast ? '└' : '├'
      const subsequentPadding = ' '.repeat(paddingLength - indent.length + 2)

      const firstMessage = `${indent}${elbow}─ ${key} ${firstPadding} ${getMessage(first)}`
      const subsequentMessages = rest
        .map((marker) => `${nextIndent}${subsequentPadding} ${getMessage(marker)}`)
        .join('\n')

      const current = [firstMessage, subsequentMessages].filter(Boolean).join('\n')
      return [current, nested].filter(Boolean).join('\n')
    })
    .join('\n')
}

/**
 * Converts a set of markers with paths into a tree of markers where the paths
 * are embedded in the tree
 */
export function convertToTree<const Node extends BaseNode>(nodes: Node[]): Tree<Node> {
  const root: Tree<Node> = {}

  // add the markers to the tree
  function addNode(node: Node, tree: Tree<Node> = root) {
    // if we've traversed the whole path
    if (!node.path.length) {
      if (!tree.nodes) tree.nodes = [] // ensure markers is defined

      // then add the marker to the front
      tree.nodes.push(node)
      return
    }

    const [current, ...rest] = node.path
    const key = pathToString([current])

    // ensure the current node has children and the next node
    if (!tree.children) tree.children = {}
    if (!(key in tree.children)) tree.children[key] = {}

    addNode({...node, path: rest}, tree.children[key])
  }

  for (const node of nodes) addNode(node)
  return root
}
