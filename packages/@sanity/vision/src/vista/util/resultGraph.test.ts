import {describe, expect, it} from 'vitest'

import {
  buildResultGraph,
  GRAPH_METRICS,
  layoutResultGraph,
  MAX_GRAPH_ROWS,
  type PlacedNode,
} from './resultGraph'

const result = [
  {
    _id: 'a',
    name: 'Ada',
    age: 36,
    active: true,
    nickname: null,
    author: {name: 'Bea', tags: ['x', 'y']},
  },
  {_id: 'b', name: 'Cy'},
]

function layout(value: unknown, collapsed: string[] = []) {
  return layoutResultGraph(buildResultGraph(value), {collapsed: new Set(collapsed), charWidth: 7})
}

function overlaps(a: PlacedNode, b: PlacedNode): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

describe('buildResultGraph', () => {
  it('makes a node of every object and array, listing its values and linking its nested ones', () => {
    const graph = buildResultGraph(result)
    expect(graph.truncated).toBe(false)
    expect(graph.nodes.map((node) => [node.id, node.label, node.summary, node.depth])).toEqual([
      ['', undefined, '[2]', 0],
      ['0', '0', '{6}', 1],
      ['1', '1', '{2}', 1],
      ['0.author', 'author', '{2}', 2],
      ['0.author.tags', 'tags', '[2]', 3],
    ])
    expect(graph.nodes[1].rows).toEqual([
      {kind: 'value', key: '_id', text: '"a"', type: 'string'},
      {kind: 'value', key: 'name', text: '"Ada"', type: 'string'},
      {kind: 'value', key: 'age', text: '36', type: 'number'},
      {kind: 'value', key: 'active', text: 'true', type: 'boolean'},
      {kind: 'value', key: 'nickname', text: 'null', type: 'null'},
      {kind: 'child', key: 'author', child: '0.author', summary: '{2}'},
    ])
    expect(graph.nodes[4].rows).toEqual([
      {kind: 'value', key: '0', text: '"x"', type: 'string'},
      {kind: 'value', key: '1', text: '"y"', type: 'string'},
    ])
  })

  it('shows a plain result as a single value', () => {
    expect(buildResultGraph(42).nodes).toEqual([
      expect.objectContaining({
        kind: 'value',
        rows: [{kind: 'value', key: '', text: '42', type: 'number'}],
      }),
    ])
  })

  it('cuts off breadth first past the node cap, and long nodes and strings', () => {
    const items = Array.from({length: 10}, (_, index) => ({index, nested: {deep: {deeper: {}}}}))
    const graph = buildResultGraph(items, 12)
    expect(graph.truncated).toBe(true)
    expect(graph.nodes).toHaveLength(12)
    // Every item is drawn before anything nested in them
    expect(graph.nodes.slice(1, 11).map((node) => node.id)).toEqual(
      items.map((_, index) => String(index)),
    )
    const cutOff = graph.nodes[10].rows.find((row) => row.kind === 'child')
    expect(cutOff).toEqual({kind: 'child', key: 'nested', child: undefined, summary: '{1}'})

    const wide = buildResultGraph(
      Object.fromEntries(Array.from({length: 40}, (_, i) => [`k${i}`, i])),
    )
    expect(wide.nodes[0].rows).toHaveLength(MAX_GRAPH_ROWS + 1)
    expect(wide.nodes[0].rows.at(-1)).toEqual({kind: 'more', count: 10})
    expect(wide.truncated).toBe(true)

    const long = buildResultGraph({text: 'x'.repeat(100)})
    const [row] = long.nodes[0].rows
    expect(row.kind === 'value' && row.text).toBe(`"${'x'.repeat(39)}…"`)
  })
})

describe('layoutResultGraph', () => {
  it('places a column per level, with no two nodes overlapping', () => {
    const {nodes, edges, width, height} = layout(result)
    const byId = new Map(nodes.map((node) => [node.node.id, node]))
    expect(byId.get('')?.x).toBe(0)
    const column = (id: string) => byId.get(id)?.x ?? -1
    expect(column('0')).toBeGreaterThan(column(''))
    expect(column('0')).toBe(column('1'))
    expect(column('0.author')).toBeGreaterThan(column('0'))
    for (const a of nodes) {
      for (const b of nodes) if (a !== b) expect(overlaps(a, b)).toBe(false)
    }
    for (const node of nodes) {
      expect(node.x + node.width).toBeLessThanOrEqual(width)
      expect(node.y + node.height).toBeLessThanOrEqual(height)
    }
    expect(edges.map((edge) => [edge.from, edge.to])).toEqual([
      ['', '0'],
      ['', '1'],
      ['0', '0.author'],
      ['0.author', '0.author.tags'],
    ])
  })

  it('links from the row that holds the child, and centres a parent on its children', () => {
    const {nodes, edges} = layout(result)
    const byId = new Map(nodes.map((node) => [node.node.id, node]))
    const parent = byId.get('0')
    const authorRow = 5
    const edge = edges.find((candidate) => candidate.to === '0.author')
    const y =
      (parent?.y ?? 0) + GRAPH_METRICS.headerHeight + authorRow * GRAPH_METRICS.rowHeight + 10
    expect(edge?.path.startsWith(`M ${(parent?.x ?? 0) + (parent?.width ?? 0)} ${y} `)).toBe(true)

    const root = byId.get('')
    const first = byId.get('0')
    const last = byId.get('1')
    const span = ((first?.y ?? 0) + (last?.y ?? 0) + (last?.height ?? 0)) / 2
    expect(Math.abs((root?.y ?? 0) + (root?.height ?? 0) / 2 - span)).toBeLessThan(
      GRAPH_METRICS.rowGap + (first?.height ?? 0),
    )
  })

  it('leaves out what a collapsed node holds', () => {
    const {nodes, edges} = layout(result, ['0'])
    expect(nodes.map((node) => node.node.id)).toEqual(['', '0', '1'])
    expect(nodes.find((node) => node.node.id === '0')).toMatchObject({
      collapsed: true,
      childCount: 1,
    })
    expect(edges).toHaveLength(2)
  })
})
