/**
 * A query result as a graph, the way jsoncrack draws JSON: every object and array is a node that
 * lists its plain values, and its nested objects and arrays are nodes of their own, linked from
 * the row of the property that holds them. Laid out left to right, a column per level.
 */

/** Objects and arrays drawn; a result with more is cut off breadth first, so its top shows */
export const MAX_GRAPH_NODES = 300
/** Rows a node lists before the rest is summed up in one */
export const MAX_GRAPH_ROWS = 30
const MAX_TEXT_LENGTH = 40

export type GraphValueType = 'string' | 'number' | 'boolean' | 'null'

export type GraphRow =
  /** A plain value, shown as it is (strings quoted and cut short) */
  | {kind: 'value'; key: string; text: string; type: GraphValueType}
  /** A nested object or array; `child` is its node, unless the graph was cut off before it */
  | {kind: 'child'; key: string; child: string | undefined; summary: string}
  /** The entries past `MAX_GRAPH_ROWS` */
  | {kind: 'more'; count: number}

export interface GraphNode {
  /** The dotted key path from the result (`0.author`), empty for the result itself */
  id: string
  /** The property or index that holds it, `undefined` for the result itself */
  label: string | undefined
  kind: 'object' | 'array' | 'value'
  /** `{3}` for an object with three properties, `[5]` for an array of five */
  summary: string
  rows: GraphRow[]
  depth: number
}

export interface ResultGraph {
  /** Breadth first, the result first */
  nodes: GraphNode[]
  /** Part of the result is left out: entries past `MAX_GRAPH_ROWS`, nodes past `MAX_GRAPH_NODES` */
  truncated: boolean
}

function isComposite(value: unknown): value is Record<string, unknown> | unknown[] {
  return typeof value === 'object' && value !== null
}

function summarize(value: Record<string, unknown> | unknown[]): string {
  return Array.isArray(value) ? `[${value.length}]` : `{${Object.keys(value).length}}`
}

function shorten(text: string): string {
  return text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH - 1)}…` : text
}

function describeValue(value: unknown): {text: string; type: GraphValueType} {
  if (typeof value === 'string') return {text: JSON.stringify(shorten(value)), type: 'string'}
  if (typeof value === 'number') return {text: String(value), type: 'number'}
  if (typeof value === 'boolean') return {text: String(value), type: 'boolean'}
  return {text: 'null', type: 'null'}
}

function entriesOf(value: Record<string, unknown> | unknown[]): [string, unknown][] {
  return Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value)
}

export function buildResultGraph(value: unknown, maxNodes = MAX_GRAPH_NODES): ResultGraph {
  if (!isComposite(value)) {
    return {
      nodes: [
        {
          id: '',
          label: undefined,
          kind: 'value',
          summary: '',
          rows: [{kind: 'value', key: '', ...describeValue(value)}],
          depth: 0,
        },
      ],
      truncated: false,
    }
  }

  const nodes: GraphNode[] = []
  let truncated = false
  let reserved = 1
  const queue: {
    value: Record<string, unknown> | unknown[]
    id: string
    label?: string
    depth: number
  }[] = [{value, id: '', depth: 0}]
  for (let head = 0; head < queue.length; head++) {
    const item = queue[head]
    const entries = entriesOf(item.value)
    const rows: GraphRow[] = []
    for (const [index, [key, entry]] of entries.entries()) {
      if (index === MAX_GRAPH_ROWS) {
        rows.push({kind: 'more', count: entries.length - index})
        truncated = true
        break
      }
      if (!isComposite(entry)) {
        rows.push({kind: 'value', key, ...describeValue(entry)})
        continue
      }
      let child: string | undefined
      if (reserved < maxNodes) {
        reserved++
        child = item.id === '' ? key : `${item.id}.${key}`
        queue.push({value: entry, id: child, label: key, depth: item.depth + 1})
      } else {
        truncated = true
      }
      rows.push({kind: 'child', key, child, summary: summarize(entry)})
    }
    nodes.push({
      id: item.id,
      label: item.label,
      kind: Array.isArray(item.value) ? 'array' : 'object',
      summary: summarize(item.value),
      rows,
      depth: item.depth,
    })
  }
  return {nodes, truncated}
}

/** Sizes of a node's parts at a zoom of 1, in pixels */
export const GRAPH_METRICS = {
  headerHeight: 28,
  rowHeight: 20,
  paddingX: 10,
  paddingBottom: 6,
  /** The header's collapse and copy buttons */
  headerButtons: 48,
  minWidth: 120,
  maxWidth: 360,
  columnGap: 72,
  rowGap: 16,
}

export interface PlacedNode {
  node: GraphNode
  x: number
  y: number
  width: number
  height: number
  /** Its children are hidden */
  collapsed: boolean
  /** Child nodes it links to, drawn or not */
  childCount: number
}

export interface PlacedEdge {
  from: string
  to: string
  /** An SVG path from the row that holds the child to the child's header */
  path: string
}

export interface GraphLayout {
  nodes: PlacedNode[]
  edges: PlacedEdge[]
  width: number
  height: number
}

function rowText(row: GraphRow): number {
  switch (row.kind) {
    case 'value':
      return row.key.length + (row.key ? 2 : 0) + row.text.length
    case 'child':
      return row.key.length + 2 + row.summary.length
    case 'more':
      return 12 + String(row.count).length
    default: {
      const unhandled: never = row
      return unhandled
    }
  }
}

function sizeOf(node: GraphNode, charWidth: number): {width: number; height: number} {
  const {headerHeight, rowHeight, paddingX, paddingBottom, headerButtons, minWidth, maxWidth} =
    GRAPH_METRICS
  const header = ((node.label ?? '').length + node.summary.length + 1) * charWidth + headerButtons
  const rows = Math.max(0, ...node.rows.map((row) => rowText(row))) * charWidth
  const width = Math.min(
    maxWidth,
    Math.max(minWidth, Math.ceil(Math.max(header, rows) + 2 * paddingX)),
  )
  return {width, height: headerHeight + node.rows.length * rowHeight + paddingBottom}
}

/**
 * Places the nodes a column per level, each subtree in a band of its own with its root centred
 * on it, so no two nodes overlap. The children of collapsed nodes are left out.
 */
export function layoutResultGraph(
  graph: ResultGraph,
  {collapsed, charWidth}: {collapsed: ReadonlySet<string>; charWidth: number},
): GraphLayout {
  const {headerHeight, rowHeight, columnGap, rowGap} = GRAPH_METRICS
  const byId = new Map(graph.nodes.map((node) => [node.id, node]))
  const childrenOf = (node: GraphNode): GraphNode[] =>
    collapsed.has(node.id)
      ? []
      : node.rows.flatMap((row) => {
          const child =
            row.kind === 'child' && row.child !== undefined ? byId.get(row.child) : undefined
          return child ? [child] : []
        })

  const sizes = new Map<string, {width: number; height: number}>()
  const columnWidths: number[] = []
  const bands = new Map<string, number>()
  const measure = (node: GraphNode): number => {
    const size = sizeOf(node, charWidth)
    sizes.set(node.id, size)
    columnWidths[node.depth] = Math.max(columnWidths[node.depth] ?? 0, size.width)
    const children = childrenOf(node)
    const childBands = children.reduce((sum, child) => sum + measure(child), 0)
    const band = Math.max(size.height, childBands + rowGap * Math.max(0, children.length - 1))
    bands.set(node.id, band)
    return band
  }
  const root = graph.nodes[0]
  const height = measure(root)

  const columnX: number[] = []
  for (let depth = 0, x = 0; depth < columnWidths.length; depth++) {
    columnX[depth] = x
    x += columnWidths[depth] + columnGap
  }

  const placed: PlacedNode[] = []
  const positions = new Map<string, PlacedNode>()
  const place = (node: GraphNode, top: number) => {
    const size = sizes.get(node.id) ?? {width: 0, height: 0}
    const band = bands.get(node.id) ?? size.height
    const childCount = node.rows.filter((row) => row.kind === 'child' && row.child).length
    const entry: PlacedNode = {
      node,
      x: columnX[node.depth],
      y: top + (band - size.height) / 2,
      width: size.width,
      height: size.height,
      collapsed: collapsed.has(node.id) && childCount > 0,
      childCount,
    }
    placed.push(entry)
    positions.set(node.id, entry)
    const children = childrenOf(node)
    const childBands =
      children.reduce((sum, child) => sum + (bands.get(child.id) ?? 0), 0) +
      rowGap * Math.max(0, children.length - 1)
    let childTop = top + (band - childBands) / 2
    for (const child of children) {
      place(child, childTop)
      childTop += (bands.get(child.id) ?? 0) + rowGap
    }
  }
  place(root, 0)

  const edges: PlacedEdge[] = []
  for (const parent of placed) {
    parent.node.rows.forEach((row, index) => {
      const child =
        row.kind === 'child' && row.child !== undefined ? positions.get(row.child) : undefined
      if (!child) return
      const x1 = parent.x + parent.width
      const y1 = parent.y + headerHeight + index * rowHeight + rowHeight / 2
      const x2 = child.x
      const y2 = child.y + headerHeight / 2
      const middle = (x1 + x2) / 2
      edges.push({
        from: parent.node.id,
        to: child.node.id,
        path: `M ${x1} ${y1} C ${middle} ${y1}, ${middle} ${y2}, ${x2} ${y2}`,
      })
    })
  }

  const lastColumn = columnWidths.length - 1
  return {
    nodes: placed,
    edges,
    width: columnX[lastColumn] + columnWidths[lastColumn],
    height,
  }
}
