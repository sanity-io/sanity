import {MenuItem as MenuItemType} from '@sanity/base/__legacy/@sanity/components'
import {useMemo} from 'react'

export function useDeskToolPaneActions(props: {
  collapsed: boolean
  menuItems?: MenuItemType[]
}): {actionItems: MenuItemType[]; menuItems: MenuItemType[]} {
  const {collapsed, menuItems: menuItemsProp} = props

  return useMemo(() => {
    const actionItems: MenuItemType[] = []
    const menuItems: MenuItemType[] = []

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
