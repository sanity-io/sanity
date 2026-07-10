import negate from 'lodash-es/negate.js'

import {
  type _PaneMenuGroup,
  type _PaneMenuItem,
  type _PaneMenuNode,
  type _PaneMenuNodeRank,
} from './components/pane/types'
import {type DocumentFieldMenuActionNode, type PaneMenuItem, type PaneMenuItemGroup} from './types'

/**
 * Resolves the effective rank of a menu entry from its declared `rank`,
 * falling back to the legacy contract: `showAsAction`/`renderAsButton` mean
 * `primary`, a `critical` tone means `destructive`, everything else is
 * `secondary`. This is the back-compat shim that keeps every existing
 * plugin's action placement stable.
 */
export function resolveMenuNodeRank(entry: {
  rank?: _PaneMenuNodeRank
  renderAsButton?: boolean
  tone?: string
}): _PaneMenuNodeRank {
  if (entry.rank) return entry.rank
  if (entry.renderAsButton) return 'primary'
  if (entry.tone === 'critical') return 'destructive'
  return 'secondary'
}

export function isMenuNodeButton(node: _PaneMenuNode): node is _PaneMenuItem | _PaneMenuGroup {
  return (node.type === 'item' || node.type === 'group') && node.rank === 'primary'
}

export const isNotMenuNodeButton = negate(isMenuNodeButton)

/**
 * Partitions overflow menu nodes by rank for rendering: secondary nodes
 * first (in registry order), then destructive nodes — the caller renders a
 * divider between the two sections. Dividers declared inside the node list
 * stay with the section they precede.
 */
export function partitionMenuNodesByRank(nodes: _PaneMenuNode[]): {
  secondary: _PaneMenuNode[]
  destructive: _PaneMenuNode[]
} {
  const secondary: _PaneMenuNode[] = []
  const destructive: _PaneMenuNode[] = []
  for (const node of nodes) {
    if (node.type !== 'divider' && node.rank === 'destructive') {
      destructive.push(node)
    } else {
      secondary.push(node)
    }
  }
  return {secondary, destructive}
}

export function resolveMenuNodes(params: {
  actionHandler: (item: PaneMenuItem) => void
  fieldActions?: DocumentFieldMenuActionNode[]
  menuItems: PaneMenuItem[]
  menuItemGroups: PaneMenuItemGroup[]
}): _PaneMenuNode[] {
  const {fieldActions = [], menuItems, menuItemGroups} = params

  const nodes: _PaneMenuNode[] = []

  let keyOffset = 0

  for (let i = 0; i < fieldActions.length; i += 1) {
    const a = fieldActions[i]

    nodes.push(mapFieldActionToPaneMenuNode(a, `${i}-${a.type}`))
  }

  keyOffset += nodes.length

  const groups: _PaneMenuGroup[] = []

  for (const itemGroup of menuItemGroups) {
    const group = groups.find((g) => g.key === itemGroup.id)

    if (!group) {
      groups.push({
        type: 'group',
        key: itemGroup.id,

        children: [],
        expanded: true,
        renderAsButton: false,
        rank: 'secondary',
        title: itemGroup.title,
        i18n: itemGroup.i18n,
      })
    }
  }

  const ungroupedItems: _PaneMenuItem[] = []

  for (let i = 0; i < menuItems.length; i += 1) {
    const item = menuItems[i]

    let group = item.group && groups.find((g) => g.key === item.group)
    const disabled = typeof item.disabled === 'string' ? {reason: item.disabled} : item.disabled

    if (item.group && !group) {
      group = {
        type: 'group',
        key: item.group,
        disabled,
        expanded: true,
        icon: item.icon,
        title: item.group,
        children: [],
        renderAsButton: false,
        rank: 'secondary',
      }
      groups.push(group)
    }

    const rank = resolveMenuNodeRank({
      rank: item.rank,
      renderAsButton: item.showAsAction ?? false,
      tone: item.tone,
    })

    const node: _PaneMenuItem = {
      type: 'item',
      key: `${keyOffset + i}-item`,

      hideSelectionIndicator: item.params?.hideSelectionIndicator === true,
      hotkey: item.shortcut,
      icon: item.icon,
      intent: item.intent,
      disabled,
      onAction: () => params.actionHandler(item),
      renderAsButton: rank === 'primary',
      rank,
      selected: item.selected,
      title: item.title,
      i18n: item.i18n,
      tone: item.tone,
    }

    if (group) {
      group.children.push(node)
    } else {
      ungroupedItems.push(node)
    }
  }

  return [...ungroupedItems, ...groups, ...nodes]
}

function mapFieldActionToPaneMenuNode(a: DocumentFieldMenuActionNode, key: string): _PaneMenuNode {
  if (a.type === 'divider') {
    return {
      type: 'divider',
      key,
    }
  }

  if (a.type === 'group') {
    const rank = resolveMenuNodeRank({renderAsButton: a.renderAsButton ?? false})

    return {
      type: 'group',
      key,

      children: a.children.map((child, childIdx) =>
        mapFieldActionToPaneMenuNode(child, `${key}-${childIdx}-${child.type}`),
      ),
      disabled: a.disabled,
      expanded: a.expanded ?? true,
      icon: a.icon,
      title: a.title,
      i18n: a.i18n,
      renderAsButton: rank === 'primary',
      rank,
    }
  }

  const rank = resolveMenuNodeRank({
    renderAsButton: a.renderAsButton ?? false,
    tone: a.tone,
  })

  return {
    type: 'item',
    key,
    intent: a.intent,
    disabled: a.disabled,
    icon: a.icon,
    iconRight: a.iconRight,
    onAction: a.onAction,
    renderAsButton: rank === 'primary',
    rank,
    selected: a.selected,
    title: a.title,
    i18n: a.i18n,
    tone: a.tone,
  }
}
