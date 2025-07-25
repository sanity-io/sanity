import {negate} from 'lodash'

import {type _PaneMenuGroup, type _PaneMenuItem, type _PaneMenuNode} from './components/pane/types'
import {type DocumentFieldMenuActionNode, type PaneMenuItem, type PaneMenuItemGroup} from './types'

export function isMenuNodeButton(node: _PaneMenuNode): node is _PaneMenuItem | _PaneMenuGroup {
  return (node.type === 'item' || node.type === 'group') && node.renderAsButton
}

export const isNotMenuNodeButton = negate(isMenuNodeButton)

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
      }
      groups.push(group)
    }

    if (group) {
      group.children.push({
        type: 'item',
        key: `${keyOffset + i}-item`,

        hotkey: item.shortcut,
        icon: item.icon,
        intent: item.intent,
        disabled,
        onAction: () => params.actionHandler(item),
        renderAsButton: item.showAsAction ?? false,
        selected: item.selected,
        title: item.title,
        i18n: item.i18n,
        tone: item.tone,
      })
    } else {
      ungroupedItems.push({
        type: 'item',
        key: `${keyOffset + i}-item`,

        hotkey: item.shortcut,
        icon: item.icon,
        intent: item.intent,
        disabled,
        onAction: () => params.actionHandler(item),
        renderAsButton: item.showAsAction ?? false,
        selected: item.selected,
        title: item.title,
        i18n: item.i18n,
        tone: item.tone,
      })
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
      renderAsButton: a.renderAsButton ?? false,
    }
  }

  return {
    type: 'item',
    key,
    intent: a.intent,
    disabled: a.disabled,
    icon: a.icon,
    iconRight: a.iconRight,
    onAction: a.onAction,
    renderAsButton: a.renderAsButton ?? false,
    selected: a.selected,
    title: a.title,
    i18n: a.i18n,
    tone: a.tone,
  }
}
