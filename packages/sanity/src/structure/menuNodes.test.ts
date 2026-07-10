import {describe, expect, it} from 'vitest'

import {type _PaneMenuNode, type _PaneMenuNodeRank} from './components/pane/types'
import {partitionMenuNodesByRank, resolveMenuNodeRank, resolveMenuNodes} from './menuNodes'

function menuItemNode(key: string, rank: _PaneMenuNodeRank): _PaneMenuNode {
  return {
    type: 'item',
    key,
    rank,
    renderAsButton: rank === 'primary',
    icon: undefined,
    onAction: () => {},
    title: key,
  }
}

function dividerNode(key: string): _PaneMenuNode {
  return {type: 'divider', key}
}

describe('resolveMenuNodeRank', () => {
  it('returns the explicit rank when one is set', () => {
    expect(resolveMenuNodeRank({rank: 'secondary', renderAsButton: true, tone: 'critical'})).toBe(
      'secondary',
    )
  })

  it("maps renderAsButton to 'primary'", () => {
    expect(resolveMenuNodeRank({renderAsButton: true})).toBe('primary')
  })

  it("maps a critical tone to 'destructive'", () => {
    expect(resolveMenuNodeRank({tone: 'critical'})).toBe('destructive')
  })

  it("defaults to 'secondary'", () => {
    expect(resolveMenuNodeRank({})).toBe('secondary')
  })

  it('prefers renderAsButton over a critical tone', () => {
    expect(resolveMenuNodeRank({renderAsButton: true, tone: 'critical'})).toBe('primary')
  })
})

describe('partitionMenuNodesByRank', () => {
  it('separates destructive nodes from secondary nodes', () => {
    const {secondary, destructive} = partitionMenuNodesByRank([
      menuItemNode('a', 'secondary'),
      menuItemNode('b', 'destructive'),
      menuItemNode('c', 'secondary'),
    ])
    expect(secondary.map((node) => node.key)).toEqual(['a', 'c'])
    expect(destructive.map((node) => node.key)).toEqual(['b'])
  })

  it('keeps dividers in the secondary section', () => {
    const {secondary, destructive} = partitionMenuNodesByRank([
      menuItemNode('a', 'secondary'),
      dividerNode('div'),
      menuItemNode('b', 'destructive'),
    ])
    expect(secondary.map((node) => node.key)).toEqual(['a', 'div'])
    expect(destructive.map((node) => node.key)).toEqual(['b'])
  })

  it('preserves order within each section', () => {
    const {secondary, destructive} = partitionMenuNodesByRank([
      menuItemNode('s1', 'secondary'),
      menuItemNode('d1', 'destructive'),
      menuItemNode('s2', 'secondary'),
      menuItemNode('d2', 'destructive'),
    ])
    expect(secondary.map((node) => node.key)).toEqual(['s1', 's2'])
    expect(destructive.map((node) => node.key)).toEqual(['d1', 'd2'])
  })
})

describe('resolveMenuNodes', () => {
  const actionHandler = () => {}

  it("gives showAsAction items rank 'primary' and renderAsButton true", () => {
    const nodes = resolveMenuNodes({
      actionHandler,
      menuItems: [{title: 'Publish', showAsAction: true}],
      menuItemGroups: [],
    })
    expect(nodes).toHaveLength(1)
    const [node] = nodes
    expect(node.type).toBe('item')
    if (node.type !== 'divider') {
      expect(node.rank).toBe('primary')
      expect(node.renderAsButton).toBe(true)
    }
  })

  it("gives critical-tone items rank 'destructive'", () => {
    const nodes = resolveMenuNodes({
      actionHandler,
      menuItems: [{title: 'Delete', tone: 'critical'}],
      menuItemGroups: [],
    })
    const [node] = nodes
    if (node.type !== 'divider') {
      expect(node.rank).toBe('destructive')
    }
  })

  it('places grouped items inside their group', () => {
    const nodes = resolveMenuNodes({
      actionHandler,
      menuItems: [{title: 'Move', group: 'g1'}],
      menuItemGroups: [{id: 'g1', title: 'Group one'}],
    })
    const group = nodes.find((node) => node.type === 'group')
    expect(group?.type).toBe('group')
    if (group?.type === 'group') {
      expect(group.key).toBe('g1')
      expect(group.children).toHaveLength(1)
      const child = group.children[0]
      expect(child.type).toBe('item')
      if (child.type === 'item') {
        expect(child.title).toBe('Move')
        expect(child.rank).toBe('secondary')
      }
    }
  })
})
