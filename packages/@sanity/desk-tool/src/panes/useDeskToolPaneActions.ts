import {useMemo} from 'react'
import {PaneMenuItem} from '../types'

export function useDeskToolPaneActions(props: {
  collapsed: boolean
  menuItems?: PaneMenuItem[]
}): {actionItems: PaneMenuItem[]; menuItems: PaneMenuItem[]} {
  const {collapsed, menuItems: menuItemsProp} = props

  return useMemo(() => {
    const actionItems: PaneMenuItem[] = []
    const menuItems: PaneMenuItem[] = []

    if (!menuItemsProp) {
      return {actionItems, menuItems}
    }

    for (const menuItem of menuItemsProp) {
      const {showAsAction} = menuItem

      const isActionItem =
        showAsAction &&
        (!collapsed || (typeof showAsAction === 'object' && showAsAction.whenCollapsed))

      if (isActionItem) {
        actionItems.push(menuItem)
      } else {
        menuItems.push(menuItem)
      }
    }

    return {actionItems, menuItems}
  }, [collapsed, menuItemsProp])
}
